import { API_URL, API_HEADERS } from './config';
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { MapPin, List, Mic, ArrowLeft, Play, Pause, RefreshCw, X, ChevronRight, Info, Eye, AlertTriangle, Accessibility, Music, Wind, Settings, Upload, Save, PenTool, Image as ImageIcon, FileAudio, Sun, ScanLine, Camera, ChevronLeft, Waves, Piano, Home, Plus, Trash2, BarChart3, PieChart, Bot, AudioWaveform, TrendingUp, Activity } from 'lucide-react';
import AiPage from './AiPage';
import { Html5Qrcode } from "html5-qrcode";
import { BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';

// 计算两点距离 (米)
const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// ============================================================================
// 1. 全局样式 & 动画
// ============================================================================
const GlobalStyles = () => (
  <style>{`
    :root {
      --minnan-red: #a83e3c;
      --minnan-red-dark: #8b2a28;
      --ocean-blue: #1b4b72;
      --vintage-cream: #f4f1ea;
      --tile-green: #2d5a4c;
      --care-yellow: #FFD700;
      --text-main: #0f172a;
      --text-secondary: #64748b;
      --card-bg: #ffffff;
      --primary-color: #f59e0b;
    }

    .font-serif { font-family: 'Noto Serif SC', serif; }
    .font-calligraphy { font-family: 'Ma Shan Zheng', cursive; }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    .show-scrollbar::-webkit-scrollbar { height: 6px; }
    .show-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
    .show-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

    @keyframes scan-line {
      0% { top: 10%; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { top: 90%; opacity: 0; }
    }
    .animate-scan { animation: scan-line 2s linear infinite; }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
    .animate-float { animation: float 4s ease-in-out infinite; }
    
    @keyframes pulse-ring {
      0% { transform: scale(0.8); opacity: 0.5; }
      100% { transform: scale(1.3); opacity: 0; }
    }
    .animate-pulse-ring { animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }

    .shape-swallowtail {
      clip-path: polygon(0% 0%, 100% 0%, 100% 88%, 50% 100%, 0% 88%);
    }
    
    .bg-piano-pattern {
      background-image: repeating-linear-gradient(
        90deg,
        rgba(0,0,0,0.03) 0px,
        rgba(0,0,0,0.03) 1px,
        transparent 1px,
        transparent 20px
      );
    }
    .bg-dark-grid {
      background-color: #151b26;
      background-image: 
        radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.14), transparent 28%),
        radial-gradient(circle at 78% 16%, rgba(245, 158, 11, 0.1), transparent 24%),
        linear-gradient(180deg, #1b2330 0%, #121926 52%, #0d131d 100%),
        linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .bg-page-canvas {
      background:
        radial-gradient(circle at top, rgba(255,255,255,0.62), transparent 28%),
        linear-gradient(180deg, #d7d2cb 0%, #e7e4df 20%, #f4f3ef 100%);
    }
    .hero-stage {
      background:
        radial-gradient(circle at 18% 14%, rgba(255, 226, 187, 0.24), transparent 24%),
        radial-gradient(circle at 72% 18%, rgba(147, 197, 253, 0.18), transparent 28%),
        radial-gradient(circle at 50% 72%, rgba(255, 206, 160, 0.12), transparent 24%),
        linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%),
        linear-gradient(180deg, #111923 0%, #0f1721 42%, #0d141d 100%);
      box-shadow: 0 32px 80px rgba(30, 41, 59, 0.16), inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .hero-grid-overlay {
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.028) 1px, transparent 1px);
      background-size: 46px 46px;
      mask-image: linear-gradient(180deg, #000 0%, #000 72%, transparent 100%);
      opacity: 0.24;
    }
    .hero-vignette {
      background: radial-gradient(circle at 50% 40%, rgba(8, 13, 19, 0) 0%, rgba(9, 15, 21, 0.08) 52%, rgba(7, 12, 18, 0.48) 100%);
    }
    .hero-mist {
      background:
        radial-gradient(circle at 50% 50%, rgba(255, 231, 204, 0.26), transparent 56%),
        radial-gradient(circle at 36% 60%, rgba(251, 191, 135, 0.12), transparent 44%),
        radial-gradient(circle at 70% 40%, rgba(148, 197, 255, 0.12), transparent 40%);
      filter: blur(54px);
      opacity: 0.95;
    }
    .hero-roof {
      background: linear-gradient(180deg, rgba(144, 91, 71, 0.12) 0%, rgba(76, 53, 49, 0.02) 100%);
      clip-path: polygon(8% 72%, 34% 56%, 58% 64%, 79% 42%, 100% 24%, 100% 100%, 0% 100%, 0% 86%);
      filter: blur(22px);
      opacity: 0.2;
    }
    .hero-arc {
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 999px;
      filter: blur(1px);
      opacity: 0.16;
    }
    .hero-wave {
      background: linear-gradient(90deg, transparent 0%, rgba(186, 230, 253, 0.18) 18%, rgba(255,255,255,0.06) 48%, rgba(255, 219, 172, 0.12) 74%, transparent 100%);
      filter: blur(20px);
      opacity: 0.38;
      border-radius: 999px;
    }
    .hero-island {
      background: radial-gradient(circle at 50% 18%, rgba(55, 65, 81, 0.16), rgba(15, 23, 38, 0.18) 45%, rgba(6, 10, 16, 0.01) 72%);
      filter: blur(28px);
      opacity: 0.22;
      border-radius: 999px 999px 36% 36%;
    }
    .hero-piano-key {
      background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.025));
      border: 1px solid rgba(255,255,255,0.04);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
      backdrop-filter: blur(8px);
    }
    .hero-shoreline {
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.16) 18%, rgba(255, 237, 210, 0.24) 46%, rgba(255,255,255,0.14) 82%, transparent 100%);
      filter: blur(5px);
      opacity: 0.44;
    }
    .hero-cloud {
      background:
        radial-gradient(circle at 30% 50%, rgba(255,255,255,0.12), transparent 38%),
        radial-gradient(circle at 54% 44%, rgba(255,255,255,0.1), transparent 34%),
        radial-gradient(circle at 70% 58%, rgba(219, 234, 254, 0.09), transparent 30%);
      filter: blur(24px);
      opacity: 0.6;
    }
    .hero-sunrise {
      background: radial-gradient(circle at 50% 50%, rgba(255, 233, 204, 0.2), rgba(255, 205, 146, 0.12) 35%, transparent 70%);
      filter: blur(34px);
      opacity: 0.7;
    }
    
    .heatmap-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 4px;
      padding: 16px;
      background: #15181e;
      border-radius: 12px;
      border: 1px solid #2d3139;
    }
    .heatmap-cell {
      aspect-ratio: 1;
      border-radius: 4px;
      background-color: #1a1d24;
      transition: all 0.3s ease;
    }
    .heatmap-cell.intensity-1 { background-color: rgba(251, 113, 133, 0.2); }
    .heatmap-cell.intensity-2 { background-color: rgba(251, 113, 133, 0.4); }
    .heatmap-cell.intensity-3 { background-color: rgba(244, 63, 94, 0.6); }
    .heatmap-cell.intensity-4 { background-color: rgba(225, 29, 72, 0.8); }
    .heatmap-cell.intensity-5 { background-color: rgba(190, 18, 60, 1); }
  `}</style>
);

// ============================================================================
// 2. 初始数据
// ============================================================================
const initialBuildingsData = [
  {
    "id": "b_003",
    "name": "黄荣远堂",
    "location": "福建路 32 号",lat: 29.700542, lng: 118.32,
    "area": "音乐核心区",
    "image": "https://images.unsplash.com/photo-1590633852467-334346e27303?q=80&w=800&auto=format&fit=crop", 
    "local_image_ref": "003黄荣远堂/黄荣远堂建筑全景图.jpg",
    "audio_file": "default_nature.mp3",
    "image_alt": "壮观的西洋别墅，拥有巨大的罗马柱和宽阔的弧形露台。",
    "smell": "这里现在是中国唱片博物馆，空气中常有一股陈旧黑胶唱片纸套的独特书卷气，混合着庭院里百年老树的木质香。",
    "history": "建于1920年，由菲律宾华侨施光从始建，后转手黄仲训。它是'会唱歌的房子'，拥有壮观的爱奥尼克巨柱和弧形回廊，是鼓浪屿西洋建筑的典范。",
    "material": "触感重点：爱奥尼克巨柱。柱体表面打磨得十分光滑冰凉，但柱头（顶端）有螺旋状的'涡卷'雕饰，摸起来像贝壳一样深邃复杂。",
    "material_type": "smooth", 
    "safety_note": "庭院入口有不规则的弧形台阶，且二楼回廊栏杆较矮（民国时期标准），请勿倚靠。"
  },
  {
    "id": "b_004",
    "name": "海天堂构",
    "location": "福建路 38 号",lat: 24.44569, lng: 118.06802,
    "area": "历史风貌区",
    "image": "https://images.unsplash.com/photo-1523539693393-0183188d4468?q=80&w=800&auto=format&fit=crop",
    "local_image_ref": "004海天堂构/海天堂构建筑全景图1.jpg",
    "audio_file": "default_nanyin.mp3",
    "image_alt": "中西合璧的代表作，中式的大屋顶压在西式的红砖楼体上。",
    "smell": "院内常年进行南音表演，飘散着功夫茶的清香；午后阳光暴晒红砖墙时，能闻到一种温暖干燥的泥土气息。",
    "history": "建于1921年，鼓浪屿十大别墅之首。最独特的是'穿西装，戴斗笠'——中式飞檐屋顶搭配西式红砖廊柱，彰显了华侨黄秀烺的爱国情怀。",
    "material": "触感重点：清水红砖与水洗砂。红砖触感粗糙温暖，颗粒感分明；而廊柱则是水洗砂材质，摸起来有沙砾感，层次丰富。",
    "material_type": "rough",
    "safety_note": "正门设有传统中式高门槛（约15cm），这是为了挡煞气设计的，但对盲人是巨大障碍，请务必抬高脚步跨越。"
  },
  {
    "id": "b_005",
    "name": "天主堂",
    "location": "鹿礁路 34-2 号 (近福建路)",lat: 24.44647, lng: 118.06772,
    "area": "宗教文化区",
    "image": "https://images.unsplash.com/photo-1548625361-98779b634329?q=80&w=800&auto=format&fit=crop",
    "local_image_ref": "005天主堂/天主堂建筑全景图1.jpg",
    "audio_file": "default_bell.mp3",
    "image_alt": "纯白色的哥特式教堂，尖塔高耸入云。",
    "smell": "作为宗教场所，空气中常年有一种清冷的石灰味，周日礼拜时会有淡淡的焚香气味，给人以净化感。",
    "history": "建于1917年，由西班牙建筑师设计。它是鼓浪屿上唯一一座纯白色的哥特式教堂，与周围红砖建筑形成鲜明对比，曾是福建教区的主教座堂。",
    "material": "触感重点：外墙灰塑。摸起来有细腻的粉末感，但整体坚硬冰冷；尖拱门的边缘线条锋利清晰，可触摸感知哥特式的尖锐美。",
    "material_type": "sharp",
    "safety_note": "教堂内部空间高大，回声较大，听觉定位可能受干扰；入口台阶陡峭，请抓紧扶手。"
  },
  {
    "id": "b_001",
    "name": "协和礼拜堂",
    "location": "福建路 60-1 号",lat: 24.44670, lng: 118.06751,
    "area": "文化地标区",
    "image": "https://images.unsplash.com/photo-1437603568260-1950d3ca6eab?q=80&w=800&auto=format&fit=crop",
    "local_image_ref": "001礼拜堂/礼拜堂建筑全景图1.jpg",
    "audio_file": "001礼拜堂环境音.m4a",
    "image_alt": "淡黄色的新古典主义风格小教堂，线条简洁。",
    "smell": "由于靠近繁忙的三岔路口，这里常有海风带来的咸湿气味，混合着旁边大榕树的树脂清香。",
    "history": "建于1863年，鼓浪屿最早的教堂。著名作家林语堂曾在此举办婚礼。建筑呈新古典主义风格，淡黄色外墙显得温润典雅。",
    "material": "触感重点：几何线条。墙面有许多规则的三角形和矩形凸起（山墙线脚），触感规整，适合盲人通过触摸感知建筑的秩序感。",
    "material_type": "smooth",
    "safety_note": "位于三岔路口，门前广场人流密集，且有多个方向的台阶，请注意防撞和避让行人。"
  },
  {
    "id": "b_002",
    "name": "许家园",
    "location": "福建路",
    "area": "居住风貌区",
    "image": "https://images.unsplash.com/photo-1599639668352-73bc47274020?q=80&w=800&auto=format&fit=crop",
    "local_image_ref": "002许家园/许家园建筑全景图1.jpg",
    "audio_file": "002许家园环境音.m4a",
    "image_alt": "一座深藏在围墙内的私家宅院，绿树成荫。",
    "smell": "由于庭院深深且植被覆盖率极高，这里是'植物气味博物馆'。雨后有浓郁的泥土腥气和苔藓味道。",
    "history": "建于20世纪30年代，是典型的华侨私家园林。主楼与附楼错落有致，保留了大量当年的生活痕迹，是探究鼓浪屿家族历史的活化石。",
    "material": "触感重点：花岗岩围墙。围墙由粗糙的条石砌成，触摸时能感觉到自然的纹理和岁月剥蚀的痕迹。",
    "material_type": "rough",
    "safety_note": "外部巷道狭窄，路面铺设有不规则的鹅卵石，盲杖容易卡入缝隙，请小心慢行。"
  },
  {
    "id": "b_006",
    "name": "李传别宅",
    "location": "福建路 44 号",
    "area": "幽静住宅区",
    "image": "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?q=80&w=800&auto=format&fit=crop",
    "local_image_ref": "006李传别宅/李传别宅建筑全景图1.jpg",
    "audio_file": "default_quiet.mp3",
    "image_alt": "红砖清水墙面的精致别墅，立面有精美的拼花。",
    "smell": "这里相对僻静，空气中有从隔壁居民家飘来的饭菜香和洗衣服的肥皂味，充满了生活气息。",
    "history": "建于1928年，是一座风格独特的红砖别墅。它的特点是红砖拼花工艺精湛，在阳光下呈现出丰富的色彩变化，是'红砖文化'的杰作。",
    "material": "触感重点：拼花红砖。墙面并非平整，而是利用红砖的凸起拼出了几何图案，手感凹凸有致，非常有韵律感。",
    "material_type": "rough",
    "safety_note": "入口处坡度较陡，且处于视线盲区，如有车辆经过需特别注意，建议贴墙行走。"
  },
  {
    "id": "b_007",
    "name": "仰高别墅",
    "location": "福建路 40 号 (高处)",
    "area": "山地风貌区",
    "image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop",
    "local_image_ref": "007仰高别墅/仰高别墅建筑全景图1.jpg",
    "audio_file": "default_wind.mp3",
    "image_alt": "依山而建的别墅，地势较高，视野开阔。",
    "smell": "因为地势较高，这里的空气流动性好，能闻到更纯净、带有盐分的海风味，少了街道的尘土气。",
    "history": "依地势而建的代表性建筑。为了适应山地地形，建筑采用了独特的基础结构。它是鼓浪屿'顺应自然'建筑理念的体现。",
    "material": "触感重点：石砌基座。为了稳固，底部使用了巨大的花岗岩块，触感极其粗粝坚硬，给人以强烈的安全感。",
    "material_type": "rough",
    "safety_note": "需要攀爬一段长台阶才能到达，且台阶两侧可能无连续扶手，视障人士强烈建议由陪伴者引导。"
  }
];

// ============================================================================
// 3. Context & Hooks
// ============================================================================
const AppContext = createContext({
  isBlindMode: false,
  toggleBlindMode: () => {},
  buildingsData: initialBuildingsData,
});

const useHaptics = () => {
    const trigger = (pattern) => { 
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(pattern); } catch(_e) { /* ignore */ }
      }
    };
  const patterns = { click: 15, success: [50, 50, 50], rough: [30, 30, 30, 30, 30], sharp: [10, 10, 10, 10, 10, 10, 10], soft: 80, safety: [200, 100, 200] };
  return { trigger, patterns };
};

const useVoice = () => {
  const [speaking, setSpeaking] = useState(false);
  const haptics = useHaptics();
  
  const speak = (text, isUrgent = false) => {
    if (!text) return;
    setSpeaking(true);
    if (isUrgent) haptics.trigger(haptics.patterns.safety);
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
       window.speechSynthesis.cancel();
       const utterance = new SpeechSynthesisUtterance(text);
       utterance.lang = 'zh-CN'; 
       utterance.onend = () => setSpeaking(false);
       window.speechSynthesis.speak(utterance);
    } else {
       setTimeout(() => setSpeaking(false), 3000);
    }
  };
  return { speaking, speak };
};

// ============================================================================
// 4. 辅助组件
// ============================================================================

const AccessibilityToggle = ({ className }) => {
  const { isBlindMode, toggleBlindMode } = useContext(AppContext);
  const haptics = useHaptics();
  return (
    <button 
      onClick={() => { toggleBlindMode(); haptics.trigger(haptics.patterns.success); }} 
      className={`z-50 p-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all font-bold text-xs tracking-widest ${isBlindMode ? 'bg-[#FFD700] text-black border-4 border-black' : 'bg-black/20 backdrop-blur-md text-white border border-white/20 hover:bg-black/30'} ${className || 'absolute top-5 right-5'}`}
    >
      {isBlindMode ? <Accessibility size={18} /> : <Eye size={18} />}
      <span>{isBlindMode ? '退出' : '关怀'}</span>
    </button>
  );
};

const ScanOverlay = ({ onClose, onScanSuccess }) => {
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [scanStatus, setScanStatus] = useState('正在启动摄像头...');
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    const stopScanner = async () => {
      try {
        await scanner.stop();
      } catch (_e) {
        void _e;
      }
      try {
        await scanner.clear();
      } catch (_e) {
        void _e;
      }
    };

    const handleDecodedText = async (decodedText) => {
      await stopScanner();
      const normalizedText = String(decodedText || '').trim();

      try {
        const url = new URL(normalizedText);
        const id = url.searchParams.get("id");
        if (id) {
          onScanSuccess(id);
          return;
        }
      } catch (_e) {
        void _e;
      }

      if (normalizedText) {
        onScanSuccess(normalizedText);
        return;
      }

      alert("无效的建筑二维码");
      onClose();
    };

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) {
          throw new Error("未检测到可用摄像头");
        }

        const preferredCamera = cameras.find(camera => /back|rear|environment|后置/i.test(camera.label)) || cameras[0];

        await scanner.start(
          { deviceId: { exact: preferredCamera.id } },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1
          },
          (decodedText) => {
            handleDecodedText(decodedText);
          },
          () => {}
        );

        if (isMounted) {
          setScanStatus('请将二维码放入取景框内');
          setScanError('');
        }
      } catch (_error) {
        if (isMounted) {
          setScanStatus('当前环境无法直接启用摄像头');
          setScanError('已切换为图片识别备用方案，你也可以在支持摄像头权限的浏览器中继续使用实时扫码。');
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [onClose, onScanSuccess]);

  const handleImageScan = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const scanner = scannerRef.current || new Html5Qrcode("reader");
    scannerRef.current = scanner;

    try {
      try {
        await scanner.stop();
      } catch (_e) {
        void _e;
      }

      const decodedText = await scanner.scanFile(file, true);
      await scanner.clear();
      onScanSuccess(String(decodedText).trim());
    } catch (_error) {
      setScanError('未能从图片中识别到二维码，请更换更清晰的截图或二维码图片。');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center animate-fade-in-up">
      <div className="w-full max-w-sm bg-white p-4 rounded-xl shadow-2xl">
         <div className="flex justify-between items-center mb-2">
             <h3 className="font-bold text-black">扫描建筑二维码</h3>
             <button onClick={onClose}><X className="text-black" /></button>
         </div>
         <div id="reader" className="w-full min-h-64 bg-gray-100 rounded-lg overflow-hidden"></div>
         <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-sm text-slate-700 font-medium">{scanStatus}</p>
            {scanError && <p className="text-xs text-amber-700 mt-1 leading-5">{scanError}</p>}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 w-full rounded-lg bg-[var(--minnan-red)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--minnan-red-dark)] transition-colors"
            >
              上传二维码图片识别
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageScan}
            />
         </div>
      </div>
      <p className="text-white mt-4 text-sm opacity-80">请将摄像头对准二维码，或直接上传二维码图片</p>
    </div>
  );
};

const LocationLoader = ({ onFound }) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { const timer = setTimeout(onFound, 1500); return () => clearTimeout(timer); }, []);
    return (
        <div className="fixed inset-0 z-[60] bg-black/90 text-white flex flex-col items-center justify-center animate-fade-in-up">
            <div className="w-20 h-20 border-4 border-t-[var(--minnan-red)] border-white/20 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold mb-2">正在获取 GPS...</h3>
        </div>
    );
};

const AudioPlayer = ({ src, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const togglePlay = () => {
    if(!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play().catch(_e => {}); }
    setIsPlaying(!isPlaying);
  };
  return (
    <div className="bg-[var(--vintage-cream)] p-4 rounded-2xl border border-[var(--minnan-red)]/30 shadow-sm flex items-center gap-4 relative overflow-hidden group">
       <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center gap-1">
          {[...Array(20)].map((_,i) => <div key={i} className={`w-1 bg-[var(--minnan-red)] rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-2'}`} style={{height: isPlaying ? ((i * 1337) % 20 + 10) + 'px' : '4px'}}></div>)}
       </div>
       <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-[var(--minnan-red)] text-white flex items-center justify-center shrink-0 shadow-lg relative z-10 hover:scale-105 transition-transform active:scale-95">
          {isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor" className="ml-1"/>}
       </button>
       <div className="flex-1 relative z-10">
          <div className="text-xs text-[var(--minnan-red)] font-bold uppercase tracking-widest mb-1">Environment Audio</div>
          <div className="text-sm font-bold text-gray-800 truncate">{title}</div>
          <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} className="hidden" />
       </div>
    </div>
  );
};

// ============================================================================
// Pro 版策展人后台 (含 Mobile Menu 模式)
// ============================================================================
const getEmptyBuilding = () => ({
  id: `b_${Date.now()}`,
  name: "新建筑",
  location: "福建路 xx 号",
  area: "未知区域",
  image: "/static/images/home_header.jpg",
  history: "请输入历史介绍...",
  smell: "请输入气味描述...",
  material: "请输入材质触感...",
  safety_note: "请输入安全提示...",
  latitude: 24.44,
  longitude: 118.06
});

const AdminPanel = ({ buildings, setBuildings, closeAdmin }) => {
  const [mode, setMode] = useState('menu'); // 'menu' | 'content'
  const [editingId, setEditingId] = useState(buildings[0]?.id);
  const [isNew, setIsNew] = useState(false);
  const [tempData, setTempData] = useState(() => buildings.find(b => b.id === editingId) || getEmptyBuilding());

  const handleChange = (field, value) => setTempData(prev => ({ ...prev, [field]: value }));
  const handleCreateNew = () => { setIsNew(true); setTempData(getEmptyBuilding()); };
  const handleSelectBuilding = (building) => {
    if (!building) return;
    setIsNew(false);
    setEditingId(building.id);
    setTempData(building);
  };

  const handleDelete = async () => {
    if (isNew) { setIsNew(false); return; }
    if (!window.confirm(`⚠️ 高能预警：\n\n确定要永久删除“${tempData.name}”吗？`)) return;

    try {
        const response = await fetch(`${API_URL}/api/buildings/${editingId}`, {
            method: 'DELETE',
            headers: { ...API_HEADERS, "x-admin-password": "8888" }
        });
        if (response.ok) {
            alert("已删除！");
            const newBuildings = buildings.filter(b => b.id !== editingId);
            setBuildings(newBuildings);
            if (newBuildings.length > 0) handleSelectBuilding(newBuildings[0]);
            else handleCreateNew();
        } else {
            alert("删除失败");
        }
    } catch (_e) { alert("网络错误"); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
        alert("正在上传...");
        const response = await fetch(`${API_URL}/api/upload/image`, { method: 'POST', headers: API_HEADERS, body: formData });
        const data = await response.json();
        if (data.url) { handleChange('image', data.url); alert("上传成功！"); }
    } catch (error) { alert("上传失败"); }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
        alert("正在上传音频...");
        const response = await fetch(`${API_URL}/api/upload/audio`, { method: 'POST', headers: API_HEADERS, body: formData });
        const data = await response.json();
        if (data.url) { handleChange('audio_file', data.url); alert("音频上传成功！"); }
    } catch (error) { alert("上传失败"); }
  };

  const handleSave = async () => {
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${API_URL}/api/buildings` : `${API_URL}/api/buildings/${tempData.id}`;
    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json", ...API_HEADERS, "x-admin-password": "8888" },
        body: JSON.stringify(tempData)
      });
      if (response.ok) {
        alert("保存成功！");
        const refresh = await fetch(`${API_URL}/api/buildings`, { headers: API_HEADERS });
        const newData = await refresh.json();
        setBuildings(newData);
        if (isNew) {
            const savedBuilding = newData.find(b => b.id === tempData.id);
            if (savedBuilding) handleSelectBuilding(savedBuilding);
            else { setIsNew(false); setEditingId(tempData.id); }
        }
      } else { alert("失败"); }
    } catch (_e) { alert("网络错误"); }
  };

  // 🔥 模式 1: 首页菜单 (Mobile Menu)
  if (mode === 'menu') {
      return (
          <div className="absolute inset-0 bg-[#f8fafc] z-50 flex flex-col p-6 animate-fade-in-up">
              <div className="flex justify-between items-center mb-12">
                  <h2 className="text-2xl font-bold font-serif text-slate-900">移动管理终端</h2>
                  <button onClick={closeAdmin} className="p-2 bg-gray-200 rounded-full"><X size={20}/></button>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                  <button onClick={() => setMode('content')} className="p-8 bg-white rounded-3xl shadow-lg border border-gray-100 flex items-center gap-6 active:scale-95 transition-transform group">
                      <div className="w-16 h-16 bg-blue-50 text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><PenTool size={32}/></div>
                      <div className="text-left flex-1">
                          <h3 className="font-bold text-xl text-slate-900 mb-1">内容管理</h3>
                          <p className="text-sm text-slate-500">编辑建筑数据与语音资源</p>
                      </div>
                      <ChevronRight className="text-gray-300 group-hover:text-emerald-400" />
                  </button>
                  
                  <button onClick={() => {
                      const el = document.getElementById('curator-section');
                      if(el) el.scrollIntoView({behavior: 'smooth'});
                      closeAdmin();
                  }} className="p-8 bg-white rounded-3xl shadow-lg border border-gray-100 flex items-center gap-6 active:scale-95 transition-transform group">
                      <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Activity size={32}/></div>
                      <div className="text-left flex-1">
                          <h3 className="font-bold text-xl text-slate-900 mb-1">数据概览</h3>
                          <p className="text-sm text-slate-500">实时热力与交互分析</p>
                      </div>
                      <ChevronRight className="text-gray-300 group-hover:text-purple-600" />
                  </button>

                  <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                      <p className="text-xs text-slate-500 font-mono">System Status: Online</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">v2.1.0 Build 20260224</p>
                  </div>
              </div>
          </div>
      )
  }

  // 🔥 模式 2: 内容编辑 (Content Editor)
  return (
    <div className="absolute inset-0 bg-[#f8fafc] z-50 overflow-y-auto pb-20 animate-fade-in-up flex flex-col">
      <div className="bg-[var(--minnan-red)] text-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-lg shrink-0">
        <h2 className="font-bold font-serif flex items-center gap-2">
            <button onClick={() => setMode('menu')}><ChevronLeft/></button> 内容管理
        </h2>
        <button onClick={() => setMode('menu')} className="bg-black/20 p-2 rounded-lg ml-2"><X size={16}/></button>
      </div>

      <div className="p-4 bg-white border-b border-gray-100 flex gap-3 overflow-x-auto snap-x show-scrollbar shrink-0">
          <button onClick={handleCreateNew} className={`px-4 py-2 rounded-xl border-2 border-dashed border-[var(--minnan-red)] text-[var(--minnan-red)] font-bold flex items-center gap-1 shrink-0 snap-start ${isNew ? 'bg-red-50' : 'bg-transparent'}`}>
            <Plus size={16}/> 新增
          </button>
          {buildings.map(b => (
            <button key={b.id} onClick={() => handleSelectBuilding(b)} 
                className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold shadow-sm transition-all snap-start shrink-0 ${!isNew && editingId === b.id ? 'bg-[var(--minnan-red)] text-white' : 'bg-gray-100 text-gray-600'}`}>
                {b.name}
            </button>
          ))}
      </div>

      <div className="p-4 bg-white border-b border-gray-100 flex gap-2 shrink-0">
          {!isNew && (
              <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-all">
                  <Trash2 size={16}/> 删除
              </button>
          )}
          <button onClick={handleSave} className="bg-[var(--minnan-red)] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-800 transition-all">
              <Save size={16}/> 保存
          </button>
      </div>

      <div className="p-6 space-y-6 max-w-2xl mx-auto w-full">
         <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-500 block mb-1">ID</label><input disabled={!isNew} value={tempData.id} onChange={e => handleChange('id', e.target.value)} className="w-full p-2 bg-slate-100 rounded border border-slate-200 font-mono text-sm text-slate-500 disabled:text-slate-400" /></div>
            <div><label className="text-xs font-bold text-slate-500 block mb-1">名称</label><input value={tempData.name} onChange={e => handleChange('name', e.target.value)} className="w-full p-2 bg-white rounded border border-slate-200 text-slate-900 caret-[var(--minnan-red)]" /></div>
         </div>

         <div>
             <label className="text-xs font-bold text-slate-500 block mb-1">图片</label>
             <div className="flex gap-2">
                 <input value={tempData.image} onChange={e => handleChange('image', e.target.value)} className="flex-1 p-2 bg-white rounded border border-slate-200 font-mono text-xs text-slate-900 caret-[var(--minnan-red)]" />
                 <label className="bg-[var(--minnan-red)] text-white px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm">
                     <Upload size={16}/><span className="text-xs font-bold">上传</span><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                 </label>
             </div>
             {tempData.image && <img src={`${API_URL}${tempData.image}`} className="w-full h-32 object-cover mt-2 rounded-lg border border-gray-200 bg-gray-50" onError={(e) => e.target.style.display='none'} alt="预览"/>}
         </div>
         
         <div>
             <label className="text-xs font-bold text-slate-500 block mb-1">音频</label>
             <div className="flex gap-2">
                 <input value={tempData.audio_file || ''} onChange={e => handleChange('audio_file', e.target.value)} className="flex-1 p-2 bg-white rounded border border-slate-200 font-mono text-xs text-slate-900 caret-[var(--minnan-red)]" />
                 <label className="bg-[var(--minnan-red)] text-white px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm">
                     <FileAudio size={16}/><span className="text-xs font-bold">上传</span><input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload}/>
                 </label>
             </div>
         </div>

         <div><label className="text-xs font-bold text-slate-500 block mb-1">历史</label><textarea rows="4" value={tempData.history} onChange={e => handleChange('history', e.target.value)} className="w-full p-2 bg-white rounded border border-slate-200 text-slate-900 caret-[var(--minnan-red)]" /></div>

         <div className="grid grid-cols-2 gap-4">
             <div><label className="text-xs font-bold text-slate-500 block mb-1">触感</label><textarea rows="3" value={tempData.material} onChange={e => handleChange('material', e.target.value)} className="w-full p-2 bg-white rounded border border-slate-200 text-sm text-slate-900 caret-[var(--minnan-red)]" /></div>
             <div><label className="text-xs font-bold text-slate-500 block mb-1">嗅觉</label><textarea rows="3" value={tempData.smell} onChange={e => handleChange('smell', e.target.value)} className="w-full p-2 bg-white rounded border border-slate-200 text-sm text-slate-900 caret-[var(--minnan-red)]" /></div>
         </div>

         <div className="bg-red-50 p-4 rounded-xl border border-red-100">
             <label className="text-xs font-bold text-red-500 block mb-1 flex items-center gap-1"><AlertTriangle size={12}/> 安全提示</label>
             <textarea rows="2" value={tempData.safety_note} onChange={e => handleChange('safety_note', e.target.value)} className="w-full p-2 bg-white rounded border border-red-200 text-sm text-slate-900 caret-[var(--minnan-red)]" />
         </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. 核心页面组件 (BlindHome, HomePage, DetailPage, BuildingListPage)
// ============================================================================

const BlindModeHome = ({ navigate, voice }) => {
    const { currentLocation, buildingsData } = useContext(AppContext);
    const fileInputRef = useRef(null);
    const handleVisionClick = () => fileInputRef.current.click();

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        voice.speak("正在识别...", true); 
        const formData = new FormData();
        formData.append("file", file);
        try {
            const response = await fetch(`${API_URL}/api/vision`, { method: 'POST', headers: API_HEADERS, body: formData });
            const data = await response.json();
            voice.speak(data.reply);
        } catch (error) { voice.speak("网络错误，请重试"); }
    };

    const handleLocation = () => {
        voice.speak("正在定位...", true);
        setTimeout(() => {
            if (currentLocation) {
                const b = buildingsData.find(b => b.id === currentLocation);
                if (b) voice.speak(`定位成功。您正位于 ${b.name} 附近。${b.safety_note}`);
            } else {
                voice.speak("定位成功。您当前位置 35米 范围内没有历史建筑，请继续前行。");
            }
        }, 1500);
    };

    return (
        <main className="flex flex-col h-full bg-black text-[var(--care-yellow)] p-6 font-sans relative overflow-hidden">
            <header className="py-6 border-b-4 border-[var(--care-yellow)] flex justify-between items-center">
                <div><h1 className="text-4xl font-bold">四感导览</h1><p className="text-xl opacity-80">视障辅助模式</p></div>
                <AccessibilityToggle className="bg-white/20 border-2 border-white text-white px-4 py-2 rounded-xl text-lg font-bold"/>
            </header>
            <div className="flex-1 flex flex-col gap-5 mt-6 pb-6">
                <button onClick={() => navigate('ai')} className="flex-1 bg-[var(--care-yellow)] text-black rounded-3xl border-4 border-white flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                    <Mic size={64} strokeWidth={2.5} /><span className="text-4xl font-bold">语音问路</span>
                </button>
                <div className="h-48 grid grid-cols-2 gap-4">
                    <button onClick={handleLocation} className="bg-[#222] text-white rounded-2xl border-2 border-white flex flex-col items-center justify-center gap-2 active:bg-[#444]">
                        <MapPin size={36} /><span className="text-2xl font-bold">我在哪</span>
                    </button>
                    <button onClick={handleVisionClick} className="bg-[#222] text-white rounded-2xl border-2 border-white flex flex-col items-center justify-center gap-2 active:bg-[#444]">
                        <ScanLine size={36} /><span className="text-2xl font-bold">拍一拍</span>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </button>
                </div>
            </div>
        </main>
    );
};

const HomePage = ({ navigate, setShowAdmin, voice }) => {
  const [showScan, setShowScan] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const { buildingsData, currentLocation } = useContext(AppContext);

  return (
    <main className="flex flex-col h-full bg-[#f8fafc] relative animate-fade-in-up overflow-hidden bg-piano-pattern">
      {showScan && <ScanOverlay onClose={() => setShowScan(false)} onScanSuccess={(id) => { 
          setShowScan(false); 
          const target = buildingsData.find(b => b.id === id);
          if (target) navigate('detail', { data: target });
          else alert("未找到该建筑信息");
      }} />}
      
      {showLocation && <LocationLoader onFound={() => { 
          setShowLocation(false); 
          if (currentLocation) {
              const targetBuilding = buildingsData.find(b => b.id === currentLocation);
              if (targetBuilding) { voice.speak("定位成功，正在进入导览。"); navigate('detail', { data: targetBuilding }); }
          } else { alert("定位完成：您当前位置附近 35 米内暂无历史建筑。"); }
      }} />}
      
      <div className="relative h-[28%] bg-[var(--minnan-red)] text-white rounded-b-[40px] shadow-2xl overflow-hidden z-10 shape-swallowtail">
        <img src={`${API_URL}/static/images/home_header.jpg`} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-multiply" alt="" onError={(e)=>e.target.style.display='none'}/>
        <div className="absolute top-0 right-0 p-4 opacity-20 transform rotate-12"><Music size={120} /></div>
        <div className="absolute top-0 w-full h-10 z-50" onDoubleClick={() => {
            const password = prompt("🔒 请输入策展人密码：");
            if (password === "8888") setShowAdmin(true);
            else if (password !== null) alert("密码错误，权限拒绝 🚫");
        }}></div>
        
        <div className="absolute top-6 left-6 z-30 flex flex-col items-start animate-fade-in">
             <span className="font-calligraphy text-2xl tracking-widest bg-white/10 px-3 py-1 rounded-lg border border-white/20 backdrop-blur-sm shadow-sm">鼓浪屿</span>
             <span className="text-[9px] uppercase tracking-[0.2em] mt-1 opacity-80 ml-1">Gulangyu Island</span>
        </div>

        <div className="absolute bottom-8 left-0 w-full px-8 flex flex-col items-center">
            <div className="mb-4"><AccessibilityToggle className="relative bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-md" /></div>
            <h1 className="text-4xl font-serif font-bold tracking-tight text-[#fffbf0] drop-shadow-md">福建路</h1>
            <div className="flex items-center justify-center gap-2 mt-2 opacity-90"><span className="w-8 h-[1px] bg-white/60"></span><span className="text-xs font-light tracking-widest uppercase">Historic District</span><span className="w-8 h-[1px] bg-white/60"></span></div>
        </div>
      </div>

      <div className="flex-1 -mt-6 relative z-20 px-5 pb-6 overflow-y-auto no-scrollbar flex flex-col gap-4">
        <button onClick={() => setShowScan(true)} className="w-full bg-white p-6 rounded-[24px] flex items-center gap-5 shadow-lg border-2 border-[var(--minnan-red)]/10 hover:border-[var(--minnan-red)] transition-all group relative overflow-hidden shrink-0">
             <div className="w-16 h-16 rounded-2xl bg-[var(--minnan-red)] text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform"><ScanLine size={32} /></div>
             <div className="flex-1 text-left"><h3 className="text-xl font-bold text-gray-800 font-serif group-hover:text-[var(--minnan-red)]">扫码寻迹</h3><p className="text-xs text-gray-400 mt-1">AR 扫描，即刻聆听</p></div>
             <ChevronRight size={24} className="text-gray-300 group-hover:text-[var(--minnan-red)]" />
        </button>

        <button onClick={() => setShowLocation(true)} className="w-full bg-white p-5 rounded-[24px] flex items-center gap-5 shadow-md border border-gray-100 hover:shadow-lg transition-all group shrink-0">
             <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform"><MapPin size={24}/></div>
             <div className="flex-1 text-left"><h3 className="text-lg font-bold text-gray-800 font-serif">定位导览</h3><p className="text-xs text-gray-400 mt-0.5">自动定位，发现周边古迹</p></div>
        </button>

        <button onClick={() => navigate('list')} className="w-full bg-white p-5 rounded-[24px] flex items-center gap-5 shadow-md border border-gray-100 hover:shadow-lg transition-all group shrink-0">
             <div className="w-12 h-12 rounded-xl bg-[var(--ocean-blue)]/10 text-[var(--ocean-blue)] flex items-center justify-center group-hover:scale-110 transition-transform"><List size={24}/></div>
             <div className="flex-1 text-left"><h3 className="text-lg font-bold text-gray-800 font-serif">建筑名录</h3><p className="text-xs text-gray-400 mt-0.5">完整收录福建路历史建筑</p></div>
        </button>

        <button onClick={() => navigate('ai')} className="w-full p-5 rounded-[24px] flex items-center gap-5 shadow-md border bg-white border-gray-100 text-gray-800 transition-all group shrink-0">
             <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Mic size={24}/></div>
             <div className="flex-1 text-left"><h3 className="text-lg font-bold font-serif">AI 语音助手</h3><p className="text-xs mt-0.5 text-gray-400">点击对话，无障碍交互</p></div>
        </button>
      </div>
    </main>
  );
};

const BuildingListPage = ({ navigate, buildings }) => {
    if (!buildings || buildings.length === 0) return <div className="p-10 text-center">数据加载中...</div>;

    return (
        <main className="flex flex-col h-full relative animate-fade-in overflow-hidden bg-[#f8fafc]">
            <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(90deg, transparent 0%, transparent 96%, rgba(0, 0, 0, 0.06) 96%, rgba(0, 0, 0, 0.06) 100%)`, backgroundSize: '20px 20px' }}></div>
            <div className="relative z-10 flex flex-col h-full">
                <div className="p-6 pb-2 flex justify-end"><AccessibilityToggle /></div>
                <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-6 no-scrollbar">
                    <div className="bg-[#1a1a1a] rounded-[24px] relative overflow-hidden shrink-0 shadow-lg min-h-[160px] flex items-center">
                        <div className="absolute inset-0 z-0">
                            <img src={`${API_URL}/static/images/banner_illustration.jpg`} className="w-full h-full object-cover opacity-60" alt="建筑背景" onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=800"; }}/>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#8b2a28]/95 via-[#a83e3c]/80 to-[#a83e3c]/40 mix-blend-multiply"></div>
                        </div>
                        <div className="relative z-10 p-6 flex flex-col items-start w-full">
                            <button onClick={() => navigate('home')} className="w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-all mb-3 text-[#8b2a28]">
                                <ArrowLeft size={20} />
                            </button>
                            <h1 className="text-3xl font-bold text-white mb-1 font-serif tracking-wider drop-shadow-md">建筑名录</h1>
                            <p className="text-gray-100 text-sm font-light tracking-wide opacity-90">探索鼓浪屿万国建筑博览的历史风貌</p>
                        </div>
                    </div>
                    {buildings.map((item, index) => (
                        <div key={item.id} onClick={() => navigate('detail', { data: item })} className="flex justify-between items-center p-4 bg-white/95 backdrop-blur-sm rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group" style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="flex gap-5 items-center flex-1">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative shadow-inner bg-gray-100">
                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name}/>
                                </div>
                                <div className="flex flex-col gap-2 flex-1">
                                    <h3 className="font-bold text-slate-900 font-serif text-xl leading-tight group-hover:text-[var(--minnan-red)] transition-colors">{item.name}</h3>
                                    <span className="self-start text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium flex items-center gap-1"><MapPin size={12} className="text-[var(--minnan-red)]"/>{item.area}</span>
                                </div>
                            </div>
                            <div className="pl-4 text-gray-300 group-hover:text-[var(--minnan-red)] group-hover:translate-x-1 transition-all"><ChevronRight size={24} /></div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
};

const DetailPage = ({ building, navigate }) => {
    if (!building) return <div className="h-full flex flex-col items-center justify-center gap-4"><p>数据加载错误</p><button onClick={() => navigate('list')} className="px-4 py-2 bg-gray-200 rounded-lg">返回列表</button></div>;
    return (
    <main className="flex flex-col h-full bg-[#f8fafc] relative animate-fade-in">
      <div className="relative h-[45vh] shrink-0">
        <img src={building.image} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f4f1ea] via-transparent to-black/40"></div>
        <button onClick={() => navigate('list')} className="absolute top-8 left-6 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white border border-white/30 z-20 hover:bg-white/30"><ArrowLeft size={24}/></button>
        <AccessibilityToggle className="absolute top-8 right-6" />
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-12">
            <div className="inline-block px-3 py-1 bg-[var(--minnan-red)] text-white text-[10px] font-bold tracking-widest uppercase rounded-full mb-3 shadow-lg border border-white/20">{building.area}</div>
            <h1 className="text-4xl font-serif font-bold text-white leading-tight drop-shadow-sm">{building.name}</h1>
            <p className="text-gray-700 mt-1 flex items-center gap-1 font-medium text-sm"><MapPin size={14} className="text-[var(--minnan-red)]"/> {building.location}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 -mt-10 relative z-10 pb-24 no-scrollbar space-y-6">
        <div className="bg-red-50 border-l-4 border-[var(--minnan-red)] p-4 rounded-r-xl shadow-sm flex gap-3 items-start">
            <AlertTriangle className="text-[var(--minnan-red)] shrink-0 mt-0.5" size={20}/>
            <div><h4 className="text-xs font-bold text-[var(--minnan-red)] uppercase tracking-wider mb-1">Safety Notice</h4><p className="text-sm text-gray-800 leading-relaxed font-medium">{building.safety_note}</p></div>
        </div>
        <AudioPlayer src={building.audio_file} title={`${building.name} · 环境音`} />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[var(--minnan-red)] flex items-center gap-2"><Music size={18}/> 历史回响</h3>
            <p className="text-gray-700 text-sm leading-7 text-justify">{building.history}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"><Sun className="text-amber-500 mb-2"/><h4 className="font-bold text-sm">触感材质</h4><p className="text-xs text-gray-600 mt-1">{building.material}</p></div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"><Wind className="text-emerald-500 mb-2"/><h4 className="font-bold text-sm">环境嗅觉</h4><p className="text-xs text-gray-600 mt-1">{building.smell}</p></div>
        </div>
      </div>
      <button onClick={() => navigate('ai')} className="absolute bottom-6 right-6 w-14 h-14 bg-[var(--ocean-blue)] rounded-full text-white shadow-xl flex items-center justify-center animate-bounce z-20"><Mic/></button>
    </main>
  );
};

// ============================================================================
// 7. Landing Page Components
// ============================================================================

const LandingHeader = ({ showDevTooltip, setShowDevTooltip }) => (
  <header className="absolute top-0 left-0 right-0 z-[100] h-20 flex items-center justify-between px-6 lg:px-12 transition-all duration-500 bg-black/10 backdrop-blur-xl border-b border-white/10">
    <div className="flex items-center gap-2 group cursor-pointer">
      <AudioWaveform className="text-white transition-transform group-hover:scale-110" size={20} strokeWidth={2.5} />
      <span className="text-lg font-bold text-white tracking-tight">Gulangyu<span className="opacity-50 font-normal">.AI</span></span>
    </div>
    
    <div className="relative">
      <button onClick={() => setShowDevTooltip(!showDevTooltip)} className="text-sm font-semibold text-gray-200 hover:text-white transition-colors">Developer</button>
      {showDevTooltip && (
          <div className="absolute top-full right-0 mt-4 w-72 p-5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 animate-fade-in-up">
              <div className="flex items-start gap-3">
                  <Info className="text-blue-500 shrink-0 mt-0.5" size={16}/>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">Terminal Access:<br/>Double-click blank space in the demo area to enter admin commands.</p>
              </div>
          </div>
      )}
    </div>
  </header>
);

const ProjectBackgroundSection = () => (
  <section id="project-background" className="py-24 bg-white landing-ui">
    <div className="container mx-auto px-6">
      <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold tracking-wider uppercase mb-6 border border-slate-200">Project Background</div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 font-serif">项目背景与愿景</h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-5 max-w-4xl mx-auto">
            鼓浪屿作为世界文化遗产，拥有密集的历史建筑、蜿蜒巷道与高差明显的地形结构，但这些独特空间特征也让视障人士在真实游览中面临“难定位、难避障、难感知”的三重挑战。
          </p>
          <p className="text-lg text-slate-600 leading-relaxed mb-14 max-w-4xl mx-auto">
            本项目尝试把数字孪生、语音交互、路径安全评估与多感官表达结合起来，构建一个不仅能“带路”，还能“解释环境、提醒风险、传递文化”的无障碍导览系统，让文化遗产的体验真正面向更多人开放。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[{ title: "缘起", desc: "源于对视障群体街区出行痛点的深入调研，希望用更细粒度的路径理解与感知反馈，补上通用导航做不到的最后一段安全引导。", color: "bg-blue-50 text-blue-600 border-blue-100" },
              { title: "愿景", desc: "打造可复制的文化遗产无障碍导览范式，让数字系统既能完成方向指引，也能承担风险预警与文化讲述的角色。", color: "bg-amber-50 text-amber-600 border-amber-100" },
              { title: "团队", desc: "由交互设计、前端工程、算法仿真与无障碍研究共同协作，强调体验、数据与落地场景之间的统一。", color: "bg-purple-50 text-purple-600 border-purple-100" }
          ].map((item, idx) => (
              <div key={idx} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-bold mb-4 border ${item.color}`}>{item.title}</div>
                  <p className="text-sm text-slate-600 leading-7">{item.desc}</p>
              </div>
          ))}
          </div>
      </div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section className="py-20 landing-ui bg-white">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">核心技术亮点</h2>
        <p className="text-slate-500">融合多模态交互与高精度定位，为视障群体打造更安全、更可感知的数字孪生导览体验。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: <Mic />, title: "多模态语音交互", desc: "基于大模型的自然语言理解，支持语音唤醒与多轮对话，像聊天一样问路。", color: "bg-blue-50 text-blue-600" },
          { icon: <MapPin />, title: "高精度无障碍导航", desc: "厘米级定位结合定制化路网数据，智能避开台阶、陡坡等高危障碍。", color: "bg-green-50 text-green-600" },
          { icon: <Piano />, title: "文化感官代偿", desc: "通过触觉反馈与环境音效，将视觉信息转化为听觉与触觉体验，还原建筑之美。", color: "bg-orange-50 text-orange-600" },
        ].map((feat, idx) => (
          <div key={idx} className="feature-card bg-white p-8 rounded-[32px] flex flex-col items-start h-full relative overflow-hidden group border border-slate-100 shadow-sm hover:shadow-xl transition-all">
            <div className={`w-14 h-14 rounded-2xl ${feat.color} flex items-center justify-center mb-6 text-xl shadow-sm group-hover:scale-110 transition-transform`}>{feat.icon}</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
            <p className="text-slate-500 text-sm leading-7">{feat.desc}</p>
            <div className="mt-auto pt-6 flex items-center gap-2 text-xs font-bold text-amber-500 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">了解更多 <ArrowLeft className="rotate-180" size={14}/></div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer id="footer" className="py-10 bg-white border-t border-gray-100 landing-ui text-center">
    <p className="text-sm text-slate-500">© 2026 Gulangyu Access Project. Designed with <span className="text-red-500">♥</span> for Accessibility.</p>
  </footer>
);

// ============================================================================
// 6. 主程序 (App Component)
// ============================================================================

// 🔥 修复版：维度一 - 算法验证 (Strict Grid Layout + Lightbox)
const DataVisSection = () => {
    // Generate heatmap cells
    const generateHeatmap = () => {
        const cells = [];
        const pattern = [
            0,0,0,1,1,2,2,1,0,0,0,0,
            0,1,2,3,4,4,3,2,1,0,0,0,
            1,2,4,5,5,5,4,3,2,1,0,0,
            0,1,3,4,5,4,3,2,1,0,0,0,
            0,0,1,2,3,2,1,0,0,0,0,0,
            0,0,0,1,1,0,0,0,0,0,0,0
        ];
        for(let i=0; i<72; i++) {
            cells.push(<div key={i} className={`heatmap-cell intensity-${pattern[i]}`} title={`Risk Intensity: ${pattern[i]}`}></div>);
        }
        return cells;
    };

    return (
        <section id="algorithm-section" className="bg-[#0f1115] landing-ui border-t border-[#2d3139] overflow-hidden py-24 relative">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -ml-40 -mt-60"></div>
          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-16 items-center">
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold tracking-wider uppercase mb-6 border border-blue-500/20">
                        Dimension 01 · Algorithm
                    </div>
                    <h2 className="text-4xl font-black text-white mb-6 leading-tight font-serif tracking-tight">算法仿真验证：<br/><span className="text-blue-400">高危障碍避让效能</span></h2>
                    <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                        基于 <strong className="text-white">1000 次蒙特卡洛仿真测试</strong>，应用空间阻力权重算法后，视障群体遭遇高危台阶的概率下降逾 <span className="text-rose-400 font-bold">60%</span>。系统通过动态调整路径权重，在保证通行效率的同时最大程度规避了复杂路况。
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#15181e] rounded-2xl p-6 border border-[#2d3139] relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                            <div className="text-4xl font-mono font-bold text-blue-400 mb-2">60%<sup className="text-xl">+</sup></div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Risk Reduction</div>
                            <div className="text-sm text-gray-400">高危障碍事件减少</div>
                        </div>
                        <div className="bg-[#15181e] rounded-2xl p-6 border border-[#2d3139] relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                            <div className="text-4xl font-mono font-bold text-emerald-400 mb-2">1000<sup className="text-xl">+</sup></div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Simulations</div>
                            <div className="text-sm text-gray-400">独立路径仿真场景</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Bar Chart */}
                    <div className="bg-[#15181e] rounded-2xl border border-[#2d3139] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#2d3139] bg-[#1a1d24] flex justify-between items-center">
                            <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Comparative Analysis</h4>
                            <span className="text-[10px] font-bold bg-[#15181e] text-gray-400 px-2 py-1 rounded border border-[#2d3139]">SIMULATION</span>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-20 text-xs font-mono font-bold text-gray-500">Algorithm</div>
                                <div className="flex-1 h-8 bg-[#1a1d24] rounded-md overflow-hidden border border-[#2d3139]">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 flex items-center px-3 text-white text-xs font-mono font-bold" style={{width: '85%'}}>85%</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-20 text-xs font-mono font-bold text-gray-500">Baseline</div>
                                <div className="flex-1 h-8 bg-[#1a1d24] rounded-md overflow-hidden border border-[#2d3139]">
                                    <div className="h-full bg-[#2d3139] flex items-center px-3 text-gray-300 text-xs font-mono font-bold" style={{width: '30%'}}>30%</div>
                                </div>
                            </div>
                            <div className="mt-4 text-right text-[10px] text-gray-500 italic">数据来源：1000次蒙特卡洛路径仿真 · 2026.03</div>
                        </div>
                    </div>

                    {/* Heatmap Chart */}
                    <div className="bg-[#15181e] rounded-2xl border border-[#2d3139] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#2d3139] bg-[#1a1d24] flex justify-between items-center">
                            <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 路径热力图 (Risk Heatmap)</h4>
                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">VISUALIZED</span>
                        </div>
                        <div className="p-6">
                            <div className="heatmap-grid">
                                {generateHeatmap()}
                            </div>
                            <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-gray-400 font-medium">
                                <span>Low Risk</span>
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-sm bg-[#1a1d24]"></div>
                                    <div className="w-3 h-3 rounded-sm bg-[rgba(251,113,133,0.2)]"></div>
                                    <div className="w-3 h-3 rounded-sm bg-[rgba(251,113,133,0.4)]"></div>
                                    <div className="w-3 h-3 rounded-sm bg-[rgba(244,63,94,0.6)]"></div>
                                    <div className="w-3 h-3 rounded-sm bg-[rgba(190,18,60,1)]"></div>
                                </div>
                                <span>High Risk</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>
    );
};
const InteractionStatsSection = () => {
    const [timeRange, setTimeRange] = useState('7D');
    
    // Mock Data for Line Chart
    const data1H = [
        { time: '10:00', value: 120 }, { time: '10:10', value: 182 }, { time: '10:20', value: 101 }, 
        { time: '10:30', value: 134 }, { time: '10:40', value: 90 }, { time: '10:50', value: 230 }, { time: '11:00', value: 210 }
    ];
    const data7D = [
        { time: 'Mon', value: 820 }, { time: 'Tue', value: 932 }, { time: 'Wed', value: 901 }, 
        { time: 'Thu', value: 934 }, { time: 'Fri', value: 1290 }, { time: 'Sat', value: 1330 }, { time: 'Sun', value: 1320 }
    ];

    const chartData = timeRange === '1H' ? data1H : data7D;

    return (
    <section id="interaction-section" className="py-24 bg-gray-50 landing-ui">
      <div className="container mx-auto px-6">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {[{ icon: <RefreshCw className="text-[var(--minnan-red)]" />, num: timeRange==='7D'?"500+":"80+", label: "仿真交互次数" },
              { icon: <AlertTriangle className="text-red-400" />, num: "98%", label: "高危台阶避让率" },
              { icon: <MapPin className="text-green-400" />, num: "Top 1", label: "热门航点: 海天堂构" },
              { icon: <Bot className="text-blue-400" />, num: "24/7", label: "AI 导游实时在线" }
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
                <div className="mb-3 p-3 bg-gray-50 rounded-full group-hover:scale-110 transition-transform">{stat.icon}</div>
                <div className="text-3xl font-black font-mono tracking-tight text-gray-800 mb-1">{stat.num}</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
         </div>

         <div className="text-center mb-10 max-w-3xl mx-auto">
            <div className="inline-block px-4 py-1.5 bg-[var(--minnan-red)]/10 text-[var(--minnan-red)] rounded-full text-sm font-bold tracking-wider uppercase mb-4">Dimension 02: User Interaction</div>
            <h2 className="text-4xl font-black text-slate-900 mb-6">核心交互意图分布</h2>
            <p className="text-lg text-slate-500">基于真实用户行为数据的多模态交互分析，揭示视障群体在复杂环境中的高频需求与行为模式。</p>
         </div>

         {/* Time Toggles */}
         <div className="flex justify-center gap-2 mb-12">
             {['1H', '7D'].map(t => (
                 <button key={t} onClick={()=>setTimeRange(t)} className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${timeRange === t ? 'bg-[var(--ocean-blue)] text-white shadow-lg scale-105' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>
                     {t === '1H' ? 'Last Hour' : 'Last 7 Days'}
                 </button>
             ))}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Trend Line Chart */}
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 relative overflow-hidden h-[400px]">
                <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={120} /></div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="w-1.5 h-6 bg-[var(--minnan-red)] rounded-full"></span>交互趋势分析</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="value" stroke="var(--ocean-blue)" strokeWidth={4} dot={{r: 4, fill: 'var(--ocean-blue)', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} animationDuration={1000} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="space-y-6">
                {[
                    { title: "语音交互为主导", desc: "45% 的用户首选语音进行非视觉交互，验证了“自然语言作为第一界面”的设计假设。", icon: <Mic className="text-white" size={20}/>, color: "bg-[#0F4C75]" },
                    { title: "主动定位需求高", desc: "30% 的交互发生在高频定位场景，表明用户对“我在哪”的安全确认感需求强烈。", icon: <MapPin className="text-white" size={20}/>, color: "bg-[#3282B8]" },
                    { title: "多感官协同", desc: "触觉反馈与听觉引导的协同工作，显著提升了空间感知的准确率与置信度。", icon: <Waves className="text-white" size={20}/>, color: "bg-[#F0A500]" },
                ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                        <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center shrink-0 shadow-lg`}>{item.icon}</div>
                        <div><h4 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h4><p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p></div>
                    </div>
                ))}
            </div>
         </div>
      </div>
    </section>
    );
};

const CuratorDashboardSection = () => {
    const [latestSummary, setLatestSummary] = useState(null);
    const [abHistory, setAbHistory] = useState([]);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [summaryError, setSummaryError] = useState('');

    const fetchAbSummary = async () => {
        setIsLoadingSummary(true);
        setSummaryError('');
        try {
            const [latestResponse, historyResponse] = await Promise.all([
                fetch(`${API_URL}/api/ab_test_summary/latest`, { headers: { "Content-Type": "application/json", ...API_HEADERS } }),
                fetch(`${API_URL}/api/ab_test_summary/history?limit=10`, { headers: { "Content-Type": "application/json", ...API_HEADERS } })
            ]);
            if (!latestResponse.ok || !historyResponse.ok) throw new Error('A/B 数据接口暂时不可用');
            const latestJson = await latestResponse.json();
            const historyJson = await historyResponse.json();
            setLatestSummary(latestJson?.status === 'success' ? latestJson.data : null);
            setAbHistory(Array.isArray(historyJson?.items) ? [...historyJson.items].reverse().map((item, index) => ({
                label: item.timestamp ? new Date(item.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : `Run ${index + 1}`,
                groupA: Number(item.group_a_hazard_rate ?? 0),
                groupB: Number(item.group_b_hazard_rate ?? 0),
                pathA: Number(item.group_a_avg_path_length ?? 0),
                pathB: Number(item.group_b_avg_path_length ?? 0),
                timeA: Number(item.group_a_avg_completion_time ?? 0),
                timeB: Number(item.group_b_avg_completion_time ?? 0),
                accepted: Boolean(item.ready_for_phase4_acceptance)
            })) : []);
        } catch (error) {
            setLatestSummary(null); setAbHistory([]);
            setSummaryError(error instanceof Error ? error.message : 'A/B 数据加载失败');
        } finally {
            setIsLoadingSummary(false);
        }
    };

    useEffect(() => { fetchAbSummary(); }, []);

    const formatPercent = (value) => `${(Number(value ?? 0) * 100).toFixed(1)}%`;
    const formatMeters = (value) => `${Number(value ?? 0).toFixed(1)}m`;
    const formatSeconds = (value) => `${Number(value ?? 0).toFixed(1)}s`;
    const latestUpdateText = latestSummary?.timestamp ? new Date(latestSummary.timestamp).toLocaleString('zh-CN', { hour12: false }) : '--';
    const phaseAcceptanceReady = latestSummary ? (typeof latestSummary.ready_for_phase4_acceptance === 'boolean' ? latestSummary.ready_for_phase4_acceptance : Number(latestSummary.group_b_hazard_rate ?? 0) < Number(latestSummary.group_a_hazard_rate ?? 0) * 0.7 && Number(latestSummary.group_b_avg_path_length ?? 0) >= Number(latestSummary.group_a_avg_path_length ?? 0)) : false;
    const chartData = abHistory.length > 0 ? abHistory : [{ label: '暂无数据', groupA: 0, groupB: 0, pathA: 0, pathB: 0, timeA: 0, timeB: 0, accepted: false }];

    return (
        <section id="curator-section" className="py-24 bg-[#0f1115] landing-ui relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -mr-40 -mt-40"></div>
          <div className="container mx-auto px-6 relative z-10 max-w-7xl">
            <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold tracking-wider uppercase mb-4 border border-purple-500/20">
                        Dimension 03 · Curator Mode
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 leading-tight font-serif tracking-tight">策展人模式：<br/><em className="text-purple-400 not-italic">全域数据实时监控</em></h2>
                    <p className="text-base text-gray-400 max-w-xl leading-relaxed">A/B 实验数据看板，实时追踪 Group A（基线）与 Group B（优化）的风险率、路径长度与完成时间差异。</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Last Update</p>
                        <p className="font-mono text-sm text-gray-300 font-medium">{latestUpdateText}</p>
                    </div>
                    <button onClick={fetchAbSummary} className="px-5 py-2.5 rounded-xl bg-[#1a1d24] border border-[#2d3139] text-gray-300 hover:bg-[#252932] transition-all flex items-center gap-2 text-sm font-bold">
                        <RefreshCw size={16} className={isLoadingSummary ? 'animate-spin text-purple-400' : 'text-purple-400'} /> 刷新数据
                    </button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('open-admin-panel'))} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 text-sm font-bold">
                        <Settings size={16} /> 管理终端
                    </button>
                </div>
            </div>

            {summaryError && (
                <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-400 text-sm flex items-center gap-3">
                    <AlertTriangle size={18} /> {summaryError}
                </div>
            )}

            {/* KPI Cards - Dark Theme */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-[#15181e] rounded-2xl p-6 border border-[#2d3139] relative overflow-hidden group hover:border-[#3f4550] transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-3">Group A Hazard Rate</div>
                    <div className="text-4xl font-mono font-bold text-white mb-2">{latestSummary ? formatPercent(latestSummary.group_a_hazard_rate) : '--'}</div>
                    <div className="text-xs font-medium text-rose-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Baseline · 最短路策略</div>
                </div>
                <div className="bg-[#15181e] rounded-2xl p-6 border border-[#2d3139] relative overflow-hidden group hover:border-[#3f4550] transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-3">Group B Hazard Rate</div>
                    <div className="text-4xl font-mono font-bold text-white mb-2">{latestSummary ? formatPercent(latestSummary.group_b_hazard_rate) : '--'}</div>
                    <div className="text-xs font-medium text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Optimized · 安全路策略</div>
                </div>
                <div className="bg-[#15181e] rounded-2xl p-6 border border-[#2d3139] relative overflow-hidden group hover:border-[#3f4550] transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-3">Avg. Path Length</div>
                    <div className="text-4xl font-mono font-bold text-white mb-2">{latestSummary ? formatMeters(latestSummary.group_b_avg_path_length) : '--'}</div>
                    <div className="text-xs font-medium text-blue-400 flex items-center gap-1">A: {latestSummary ? formatMeters(latestSummary.group_a_avg_path_length) : '--'} / B: {latestSummary ? formatMeters(latestSummary.group_b_avg_path_length) : '--'}</div>
                </div>
                <div className="bg-[#15181e] rounded-2xl p-6 border border-[#2d3139] relative overflow-hidden group hover:border-[#3f4550] transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-3">Avg. Completion Time</div>
                    <div className="text-4xl font-mono font-bold text-white mb-2">{latestSummary ? formatSeconds(latestSummary.group_b_avg_completion_time) : '--'}</div>
                    <div className="text-xs font-medium text-purple-400 flex items-center gap-1">A: {latestSummary ? formatSeconds(latestSummary.group_a_avg_completion_time) : '--'} / B: {latestSummary ? formatSeconds(latestSummary.group_b_avg_completion_time) : '--'}</div>
                </div>
            </div>

            {/* Bottom Panels - Dark Theme */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-5">
                {/* Chart 1: Risk Rate */}
                <div className="bg-[#15181e] p-6 rounded-3xl border border-[#2d3139] h-[320px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-gray-200 font-bold text-sm flex items-center gap-2"><Activity size={16} className="text-rose-500"/> 风险率 A/B 对比</h4>
                        <span className="text-[10px] font-bold bg-[#1a1d24] text-gray-400 px-2 py-1 rounded border border-[#2d3139]">RISK RATE</span>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" vertical={false} />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} tickFormatter={(val) => `${Math.round(val * 100)}%`} />
                                <Tooltip formatter={(value, name) => [`${(Number(value) * 100).toFixed(1)}%`, name === 'groupA' ? 'A组 (对照)' : 'B组 (实验)']} contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', fontSize: '12px', color: '#fff'}} />
                                <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} formatter={(value) => <span className="text-gray-400 font-medium ml-1">{value === 'groupA' ? 'A组 (最短路)' : 'B组 (安全路)'}</span>} />
                                <Line type="monotone" dataKey="groupA" stroke="#fb7185" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#15181e'}} activeDot={{r: 6}} />
                                <Line type="monotone" dataKey="groupB" stroke="#34d399" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#15181e'}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Path Length */}
                <div className="bg-[#15181e] p-6 rounded-3xl border border-[#2d3139] h-[320px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-gray-200 font-bold text-sm flex items-center gap-2"><MapPin size={16} className="text-blue-500"/> 路径长度对比</h4>
                        <span className="text-[10px] font-bold bg-[#1a1d24] text-gray-400 px-2 py-1 rounded border border-[#2d3139]">DISTANCE (m)</span>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" vertical={false} />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} />
                                <Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}m`, name === 'pathA' ? 'A组 (对照)' : 'B组 (实验)']} contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', fontSize: '12px', color: '#fff'}} />
                                <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} formatter={(value) => <span className="text-gray-400 font-medium ml-1">{value === 'pathA' ? 'A组 (最短路)' : 'B组 (安全路)'}</span>} />
                                <Bar dataKey="pathA" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="pathB" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Result Card */}
                <div className="bg-[#15181e] p-6 rounded-3xl border border-[#2d3139] h-[320px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <BarChart3 size={100} color="#fff"/>
                    </div>
                    <div className="flex items-center justify-between mb-5 relative z-10">
                        <h4 className="text-gray-200 font-bold text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> 实验验收结果</h4>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${phaseAcceptanceReady ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            {phaseAcceptanceReady ? '✓ READY' : 'PENDING'}
                        </span>
                    </div>
                    
                    <div className="space-y-3 relative z-10 flex-1">
                        <div className="bg-[#1a1d24] border border-[#2d3139] rounded-xl p-3.5">
                            <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Test Run ID</div>
                            <div className="font-mono text-xs text-gray-300 font-medium break-all">{latestSummary?.test_run_id || 'Waiting for data...'}</div>
                        </div>
                        <div className="bg-[#1a1d24] border border-[#2d3139] rounded-xl p-4 flex-1">
                            <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-3">Acceptance Criteria</div>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-gray-400 font-medium">B组风险率 &lt; A组 70%</span>
                                    <span className={latestSummary && Number(latestSummary.group_b_hazard_rate ?? 0) < Number(latestSummary.group_a_hazard_rate ?? 0) * 0.7 ? 'text-emerald-400 font-bold font-mono' : 'text-amber-400 font-bold font-mono'}>{latestSummary && Number(latestSummary.group_b_hazard_rate ?? 0) < Number(latestSummary.group_a_hazard_rate ?? 0) * 0.7 ? 'PASS' : 'FAIL'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-gray-400 font-medium">B组路径长度 &ge; A组</span>
                                    <span className={latestSummary && Number(latestSummary.group_b_avg_path_length ?? 0) >= Number(latestSummary.group_a_avg_path_length ?? 0) ? 'text-emerald-400 font-bold font-mono' : 'text-amber-400 font-bold font-mono'}>{latestSummary && Number(latestSummary.group_b_avg_path_length ?? 0) >= Number(latestSummary.group_a_avg_path_length ?? 0) ? 'PASS' : 'FAIL'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>
    );
};
export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [buildingsData, setBuildingsData] = useState([]);
  const [showAppMockup, setShowAppMockup] = useState(false);
  const [showDevTooltip, setShowDevTooltip] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const voice = useVoice();

  useEffect(() => {
    const handleOpenAdmin = () => setShowAdmin(true);
    window.addEventListener('open-admin-panel', handleOpenAdmin);
    return () => window.removeEventListener('open-admin-panel', handleOpenAdmin);
  }, []);

  const navigate = (target, params = {}) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      if (params.data) setSelectedBuilding(params.data);
      setScreen(target);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');
    if (targetId && buildingsData.length > 0) {
      const targetBuilding = buildingsData.find(b => b.id === targetId);
      if (targetBuilding) {
        setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate('detail', { data: targetBuilding });
            if (isBlindMode) {
                 voice.speak(`欢迎体验纸质地图联动。已为您定位到：${targetBuilding.name}`, true);
            } else {
                 voice.speak(`已为您打开：${targetBuilding.name}`);
            }
        }, 500);
      }
    }
  }, [buildingsData, isBlindMode, voice]);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            let nearestId = null;
            let minDist = Infinity;
            buildingsData.forEach(b => {
                if (b.lat && b.lng) {
                    const dist = getDistanceFromLatLonInM(latitude, longitude, b.lat, b.lng);
                    if (dist < minDist) { minDist = dist; nearestId = b.id; }
                }
            });

            if (isBlindMode && nearestId && minDist < 50) {
                if (minDist < 10) {
                     if (currentLocation !== nearestId) {
                         setCurrentLocation(nearestId);
                         const b = buildingsData.find(i => i.id === nearestId);
                         voice.speak(`到达目的地：${b.name}`, true); 
                         if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                     }
                } else if (minDist < 30) {
                    if (Math.random() > 0.8 && navigator.vibrate) navigator.vibrate(50);
                } else {
                    if (Math.random() > 0.95 && navigator.vibrate) navigator.vibrate(30);
                }
            }
        },
        (err) => console.error("GPS Error", err),
        { enableHighAccuracy: true, maximumAge: 2000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [buildingsData, isBlindMode, currentLocation, voice]);

  useEffect(() => {
    fetch(`${API_URL}/api/buildings`, { headers: { "Content-Type": "application/json", ...API_HEADERS } })
    .then(res => res.json())
    .then(data => setBuildingsData(data && data.length > 0 ? data : initialBuildingsData))
    .catch(() => setBuildingsData(initialBuildingsData));
  }, []);
  
  const toggleBlindMode = () => { 
      window.speechSynthesis.cancel();
      setIsBlindMode(!isBlindMode);
      if (!isBlindMode) {
          setTimeout(() => {
             const u = new SpeechSynthesisUtterance("已开启关怀模式。双击屏幕下方按钮使用语音助手。");
             u.lang = 'zh-CN'; window.speechSynthesis.speak(u);
          }, 100);
      }
  };

  return (
    <AppContext.Provider value={{ isBlindMode, toggleBlindMode, buildingsData, currentLocation }}>
      <GlobalStyles />
      <div className="min-h-screen bg-page-canvas text-white font-sans app-root relative selection:bg-amber-400 selection:text-slate-900 overflow-x-hidden">
        <section className="px-4 pt-4 lg:px-6 lg:pt-6">
          <div className="hero-stage relative overflow-hidden rounded-[36px] border border-black/10 min-h-[calc(100vh-2rem)]">
            <div className="hero-grid-overlay absolute inset-0"></div>
            <div className="hero-vignette absolute inset-0"></div>
            <div className="hero-sunrise absolute left-[10%] top-[10%] w-80 h-80 rounded-full"></div>
            <div className="absolute top-[8%] right-[10%] w-96 h-96 bg-sky-200/8 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[60rem] h-48 bg-gradient-to-r from-transparent via-sky-100/10 to-transparent blur-[90px]"></div>
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950/18 via-slate-950/6 to-transparent"></div>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="hero-cloud absolute left-[6%] top-[14%] w-[28rem] h-28"></div>
              <div className="hero-cloud absolute right-[8%] top-[16%] w-[24rem] h-24 opacity-40"></div>
              <div className="hero-mist absolute left-[6%] top-[28%] w-[34rem] h-[18rem]"></div>
              <div className="hero-roof absolute right-[0%] top-[16%] w-[26rem] h-[12rem]"></div>
              <div className="hero-island absolute left-[16%] bottom-[-8%] w-[46rem] h-[17rem]"></div>
              <div className="hero-wave absolute left-[20%] bottom-[24%] w-[28rem] h-8 rotate-[-7deg]"></div>
              <div className="hero-wave absolute right-[14%] bottom-[19%] w-[16rem] h-6 rotate-[7deg] opacity-25"></div>
              <div className="hero-shoreline absolute left-[32%] bottom-[18%] w-[22rem] h-[3px] rotate-[-15deg]"></div>
              <div className="hero-arc absolute left-[4%] top-[22%] w-52 h-52"></div>
              <div className="hero-arc absolute right-[8%] top-[20%] w-64 h-64"></div>
              <div className="absolute left-[8%] bottom-[13%] flex items-end gap-2 opacity-14 blur-[1px]">
                {[46, 62, 74, 58, 44, 68, 52].map((height, idx) => (
                  <span key={idx} className="hero-piano-key w-6 rounded-t-[14px]" style={{ height: `${height}px` }}></span>
                ))}
              </div>
              <div className="absolute left-[10%] bottom-[11%] w-40 h-24 rounded-full border border-white/8 blur-[2px] opacity-10"></div>
            </div>
            <LandingHeader showDevTooltip={showDevTooltip} setShowDevTooltip={setShowDevTooltip} />

            <div className="container mx-auto px-4 lg:px-8 pt-28 pb-12 relative z-10">
              <div className={`flex flex-col lg:flex-row items-center transition-all duration-1000 ease-in-out min-h-[calc(100vh-190px)] ${showAppMockup ? 'justify-between gap-12 lg:gap-24' : 'justify-center'}`}>
                <div className={`flex flex-col space-y-8 landing-ui z-20 transition-all duration-1000 ease-in-out ${showAppMockup ? 'lg:w-1/2 text-center lg:text-left items-center lg:items-start' : 'w-full max-w-4xl text-center items-center'}`}>
               <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 backdrop-blur-sm text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2 transition-all duration-700 ${showAppMockup ? '' : 'mx-auto'}`}>
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> v2.0 Beta
               </div>
               <h1 className="text-6xl lg:text-8xl font-black text-white leading-none tracking-tighter mb-4 font-serif">听见·<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500 drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]">鼓浪屿</span><br/><span className="text-gray-400 text-3xl lg:text-4xl block mt-6 font-bold tracking-tight font-sans">多感知无障碍导航系统</span></h1>
               <div className="space-y-5 max-w-2xl text-left">
                   <p className="text-xl text-gray-300 font-medium tracking-wide">用科技温暖每一段旅程，让世界文化遗产触手可及。</p>
                   <p className="text-base text-gray-400 leading-relaxed">
                     专为视障群体打造的<span className="text-white font-bold">鼓浪屿数字孪生无障碍仿真系统</span>。本项目立足于空间计算与无障碍设计的交叉领域，旨在解决视障人群在复杂历史街区中的独立出行难题。
                   </p>
                   <p className="text-base text-gray-400 leading-relaxed">
                     我们通过构建高精度路网模型，融合 <span className="text-amber-400 font-bold">AI 意图识别</span> 与 <span className="text-emerald-400 font-bold">避障寻路算法</span>，在保证通行效率的同时，将高危路段暴露率降低 60% 以上，实现真正的“安全第一”导览体验。
                   </p>
               </div>
               <div className="flex flex-col sm:flex-row gap-4 pt-8">
                 <button onClick={() => setShowAppMockup(true)} className={`px-8 py-4 rounded-full text-lg font-bold shadow-xl shadow-blue-500/20 border flex items-center justify-center gap-2 group transition-all duration-300 ${showAppMockup ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300' : 'bg-white text-slate-950 border-white/80 hover:bg-amber-50 hover:scale-105'}`}>
                   {showAppMockup ? '重新演示' : '开始体验'} <Play size={18} className="group-hover:translate-x-1 transition-transform" fill="currentColor"/>
                 </button>
                 <button onClick={() => document.getElementById('project-background').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2 text-gray-200 border border-white/12 bg-white/6 hover:bg-white/10 hover:text-white transition-all">了解更多 <ChevronRight size={18}/></button>
               </div>
               <div className="pt-8 flex items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                  <span className="font-bold text-white text-sm tracking-widest">OPENAI</span>
                  <span className="font-bold text-white text-sm tracking-widest">REACT</span>
                  <span className="font-bold text-white text-sm tracking-widest">FASTAPI</span>
               </div>
                </div>

                <div className={`relative z-30 transition-all duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)] transform ${showAppMockup ? 'w-full lg:w-[420px] h-[850px] opacity-100 translate-y-0 rotate-0' : 'w-0 h-0 opacity-0 translate-y-32 pointer-events-none rotate-6 overflow-hidden'}`}>
               <div className="w-full h-full bg-black rounded-[60px] shadow-[inset_0_0_2px_1px_rgba(255,255,255,0.15),0_0_0_6px_#272727,0_0_0_7px_#000,0_30px_60px_-12px_rgba(0,0,0,0.6)] border-[8px] border-[#121212] relative overflow-hidden">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-50 flex justify-between items-center px-4 transition-all hover:w-[200px] hover:h-[50px] group cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-[#1e1e1e] group-hover:bg-green-500 transition-colors"></div>
                      <div className="w-2 h-2 rounded-full bg-[#1e1e1e] group-hover:bg-emerald-500 transition-colors"></div>
                  </div>
                  <div className="w-full h-full bg-[#f8fafc] rounded-[50px] overflow-hidden relative flex flex-col shadow-[inset_0_0_12px_rgba(0,0,0,0.4)]">
                      <div className="h-14 flex justify-between items-end px-8 pb-2 shrink-0 z-40 select-none text-black font-medium text-[15px]">
                          <span className="ml-1 tracking-wide">9:41</span>
                          <div className="flex gap-1.5 items-center">
                              <div className="w-4 h-2.5 bg-black rounded-[1px]"></div>
                              <div className="w-3 h-2.5 bg-black rounded-[1px]"></div>
                              <div className="w-5 h-3 border-[1.5px] border-black rounded-[2.5px] relative"><div className="absolute inset-0.5 bg-black rounded-[0.5px]"></div></div>
                          </div>
                      </div>
                      {showAdmin && <AdminPanel buildings={buildingsData} setBuildings={setBuildingsData} closeAdmin={() => setShowAdmin(false)} />}
                      <div className="flex-1 overflow-hidden relative w-full h-full" id="main-content">
                        {isBlindMode ? (
                            screen === 'ai' ? <AiPage navigate={navigate} isBlindMode={true} /> : <BlindModeHome navigate={navigate} voice={voice} />
                        ) : (
                            <>
                                {screen === 'home' && <HomePage navigate={navigate} setShowAdmin={setShowAdmin} voice={voice} />}
                                {screen === 'list' && <BuildingListPage navigate={navigate} buildings={buildingsData} />}
                                {screen === 'detail' && <DetailPage building={selectedBuilding} navigate={navigate} voice={voice} />}
                                {screen === 'ai' && <AiPage navigate={navigate} isBlindMode={false} />}
                            </>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[140px] h-[5px] bg-black/80 rounded-full z-50"></div>
                  </div>
               </div>
               <div className="absolute inset-0 rounded-[3.5rem] ring-1 ring-white/20 pointer-events-none z-50"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ProjectBackgroundSection />
        <DataVisSection />
        <InteractionStatsSection />
        <CuratorDashboardSection />
        <FeaturesSection />
        <Footer />
      </div>
    </AppContext.Provider>
  );
}
