import { API_URL, API_HEADERS } from './config';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, Volume2, User, Bot, Loader2, Send } from 'lucide-react';

const AiPage = ({ navigate, isBlindMode }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: '您好！我是您的专属导游。请点击下方红色按钮提问，或者直接说出您想去的地方。' }
  ]);
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // 新增：记录手机罗盘朝向
  const [userBearing, setUserBearing] = useState(null);

  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null); // 🔥 新增：容器 Ref

  // 监听手机绝对方向 (罗盘/陀螺仪)
  useEffect(() => {
    const handleOrientation = (event) => {
      let bearing = null;
      if (event.webkitCompassHeading) {
        // iOS 罗盘
        bearing = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Android 绝对方向 (0表示正北，逆时针增加，所以需要 360 - alpha)
        bearing = 360 - event.alpha;
      }
      
      if (bearing !== null) {
        setUserBearing(bearing);
      }
    };

    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if ('ondeviceorientationabsolute' in window) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      } else {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // 自动滚动到底部 (修复版：仅内部滚动，不影响 Window)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // 组件卸载时停止语音
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 核心功能 3: 语音合成 (TTS)
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // 打断上一次
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9; // 语速稍慢，适合老年视障者
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // 核心功能 2: 发送消息给后端
  const handleSendMessage = async (text, asrConfidence = null) => {
    if (!text.trim()) return;

    // 1. 上屏用户消息
    setMessages(prev => [...prev, { role: 'user', text: text }]);
    setIsProcessing(true);

    try {
      // 2. 请求后端 API
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", 
          ...API_HEADERS 
        },
        body: JSON.stringify({ 
          message: text,
          user_bearing: userBearing, // 👈 发送朝向给后端
          asr_confidence: asrConfidence
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const aiReply = data.reply;

      // 3. 上屏 AI 回复
      setMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
      
      // 4. 自动语音播报
      speakText(aiReply);

    } catch (error) {
      console.error("API Error:", error);
      const errorMsg = "抱歉，导游信号好像断了，请稍后再试。";
      setMessages(prev => [...prev, { role: 'ai', text: errorMsg }]);
      speakText(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // 核心功能 1: 语音识别 (STT)
  const startListening = () => {
    // 兼容性处理
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("抱歉，您的浏览器不支持语音识别功能，请尝试使用 Chrome 浏览器。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN'; 
    recognition.continuous = false; // 说完一句自动停止
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      // 如果正在说话，先停止
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      console.log("听到:", transcript);
      if (transcript) {
        handleSendMessage(transcript, typeof confidence === 'number' ? confidence : null);
      }
    };

    recognition.onerror = (event) => {
      console.error("语音识别错误:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("请允许浏览器访问麦克风。");
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("启动语音识别失败:", e);
      setIsListening(false);
    }
  };

  const handleMicClick = () => {
    if (isProcessing) return; // 处理中禁止点击

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      startListening();
    }
  };

  const handleTextSubmit = () => {
    if (isProcessing) return;
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    handleSendMessage(text);
  };

  // 样式定义
  const bgColor = isBlindMode ? 'bg-black' : 'bg-[#f4f1ea]';
  const textColor = isBlindMode ? 'text-[#FFD700]' : 'text-gray-800';
  
  // 气泡样式
  const bubbleAiBg = isBlindMode 
    ? 'bg-[#333] border border-[#FFD700] text-white' 
    : 'bg-white border border-gray-100 text-gray-800 shadow-sm';
    
  const bubbleUserBg = isBlindMode 
    ? 'bg-[#FFD700] text-black font-bold' 
    : 'bg-[var(--minnan-red)] text-white shadow-sm';

  return (
    <div className={`flex flex-col h-full w-full ${bgColor} relative transition-colors duration-300 overflow-hidden`}>
      {/* 顶部标题栏 */}
      <div className={`p-4 flex items-center gap-3 sticky top-0 z-10 border-b ${isBlindMode ? 'bg-black border-[#FFD700]' : 'bg-white/90 backdrop-blur-md border-gray-200'}`}>
        <button 
          onClick={() => navigate('home')} 
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${isBlindMode ? 'bg-black border-[#FFD700] text-[#FFD700] hover:bg-[#333]' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          aria-label="返回首页"
        >
          <ArrowLeft size={20}/>
        </button>
        <div>
          <h1 className={`text-lg font-bold flex items-center gap-2 ${textColor}`}>
            {isBlindMode ? '语音导盲模式' : 'AI 语音向导'}
            {isSpeaking && <Volume2 size={18} className={`${isBlindMode ? 'text-[#FFD700]' : 'text-[var(--minnan-red)]'} animate-pulse`}/>}
          </h1>
        </div>
      </div>

      {/* 聊天内容区 (固定高度，内部滚动) */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-6 pb-40 scroll-smooth overscroll-contain"
        style={{ scrollBehavior: 'auto' }} // 强制禁用全局平滑滚动，改用手动控制
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {/* 头像 */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'ai' 
                ? (isBlindMode ? 'bg-[#FFD700] text-black' : 'bg-white border border-gray-200 text-[var(--minnan-red)]') 
                : (isBlindMode ? 'bg-[#333] border border-[#FFD700] text-white' : 'bg-gray-200 text-gray-600')
            }`}>
              {msg.role === 'ai' ? <Bot size={22}/> : <User size={22}/>}
            </div>
            
            {/* 消息气泡 */}
            <div className={`p-4 rounded-2xl max-w-[85%] text-[15px] leading-relaxed break-words ${msg.role === 'ai' ? bubbleAiBg : bubbleUserBg} ${isBlindMode ? 'text-lg' : ''}`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {/* 状态反馈：正在规划/思考 */}
        {isProcessing && (
          <div className="flex gap-3 animate-pulse">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isBlindMode ? 'bg-[#FFD700] text-black' : 'bg-white border border-gray-200 text-[var(--minnan-red)]'}`}>
              <Bot size={22}/>
            </div>
            <div className={`p-4 rounded-2xl ${bubbleAiBg} flex items-center gap-2`}>
              <Loader2 size={18} className="animate-spin"/>
              <span>正在规划安全路线...</span>
            </div>
          </div>
        )}
      </div>

      {/* 底部语音控制区 */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 pb-8 flex flex-col justify-end items-center h-48 pointer-events-none ${isBlindMode ? 'bg-gradient-to-t from-black via-black/90 to-transparent' : 'bg-gradient-to-t from-[#f4f1ea] via-[#f4f1ea]/90 to-transparent'}`}>
        <div className="w-full max-w-xl mb-3 flex gap-2 pointer-events-auto">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTextSubmit();
              }
            }}
            placeholder="可直接输入地点，如：从李传别宅到黄荣远堂"
            className={`flex-1 h-11 px-4 rounded-xl border outline-none ${isBlindMode ? 'bg-[#111] border-[#FFD700] text-[#FFD700] placeholder:text-[#b9a94f]' : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-400'}`}
            disabled={isProcessing}
          />
          <button
            onClick={handleTextSubmit}
            disabled={isProcessing || !inputText.trim()}
            className={`h-11 px-4 rounded-xl flex items-center justify-center ${isBlindMode ? 'bg-[#FFD700] text-black' : 'bg-[var(--minnan-red)] text-white'} ${isProcessing || !inputText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Send size={18} />
          </button>
        </div>
        
        {/* 状态提示文本 */}
        <div className={`mb-4 text-center font-medium transition-opacity duration-300 ${isListening || isProcessing ? 'opacity-100' : 'opacity-0'} ${isBlindMode ? 'text-[#FFD700]' : 'text-gray-600'}`}>
          {isListening ? "正在倾听..." : (isProcessing ? "正在思考..." : "")}
        </div>

        {/* 麦克风按钮 */}
        <button 
          onMouseDown={(e) => { e.preventDefault(); handleMicClick(); }}
          onTouchStart={(e) => { e.preventDefault(); handleMicClick(); }}
          onClick={(e) => e.preventDefault()} // 🔥 阻止默认点击行为，防止获得焦点
          disabled={isProcessing}
          aria-label={isListening ? "停止录音" : "开始录音"}
          className={`pointer-events-auto w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform active:scale-95 ${
            isBlindMode 
              ? 'bg-[#FFD700] text-black border-4 border-white hover:bg-[#ffe033]' 
              : 'bg-[var(--minnan-red)] text-white hover:bg-[#d43d3d] shadow-red-500/30'
          } ${isListening ? 'scale-110 ring-4 ring-opacity-50 ring-current animate-pulse' : ''} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? (
            // 录音中的波纹动画
            <div className="flex gap-1 items-center h-6 justify-center">
              <span className="w-1 bg-current rounded-full h-full animate-[bounce_1s_infinite]"></span>
              <span className="w-1 bg-current rounded-full h-2/3 animate-[bounce_1s_infinite_0.2s]"></span>
              <span className="w-1 bg-current rounded-full h-full animate-[bounce_1s_infinite_0.4s]"></span>
            </div>
          ) : (
            <Mic size={36} />
          )}
        </button>
        
        <div className={`mt-3 text-sm font-medium ${isBlindMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {isListening ? "点击停止" : "点击说话"}
        </div>
      </div>
    </div>
  );
};

export default AiPage;
