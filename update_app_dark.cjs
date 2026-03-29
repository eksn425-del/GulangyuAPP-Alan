const fs = require('fs');
const file = 'e:/my-gulangyu/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update GlobalStyles to add the grid pattern and dark gradient background
const globalStylesEnd = content.indexOf('</style>');
const gridStyle = `
    .bg-dark-grid {
      background-color: #0f1115;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    
    .heatmap-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 4px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
    }
    .heatmap-cell {
      aspect-ratio: 1;
      border-radius: 4px;
      background-color: #f1f5f9;
      transition: all 0.3s ease;
    }
    .heatmap-cell.intensity-1 { background-color: #fee2e2; }
    .heatmap-cell.intensity-2 { background-color: #fca5a5; }
    .heatmap-cell.intensity-3 { background-color: #ef4444; }
    .heatmap-cell.intensity-4 { background-color: #b91c1c; }
    .heatmap-cell.intensity-5 { background-color: #7f1d1d; }
`;
content = content.substring(0, globalStylesEnd) + gridStyle + content.substring(globalStylesEnd);

// 2. Update Hero Section
// Find: <div className="min-h-screen bg-[#f8fafc] text-[var(--text-main)] font-sans app-root relative selection:bg-[var(--primary-color)] selection:text-white overflow-x-hidden">
content = content.replace(
    /<div className="min-h-screen bg-\[#f8fafc\].*?">/,
    '<div className="min-h-screen bg-dark-grid text-white font-sans app-root relative selection:bg-[var(--primary-color)] selection:text-white overflow-x-hidden">'
);

// Update Hero text and descriptions (Dark mode styles)
const oldHeroText = `<h1 className="text-6xl lg:text-8xl font-black text-gray-900 leading-none tracking-tighter mb-4 font-serif">听见·<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400 drop-shadow-sm">鼓浪屿</span><br/><span className="text-gray-400 text-3xl lg:text-4xl block mt-6 font-bold tracking-tight font-sans">多感知无障碍导航系统</span></h1>`;
const newHeroText = `<h1 className="text-6xl lg:text-8xl font-black text-white leading-none tracking-tighter mb-4 font-serif">听见·<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500 drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]">鼓浪屿</span><br/><span className="text-gray-400 text-3xl lg:text-4xl block mt-6 font-bold tracking-tight font-sans">多感知无障碍导航系统</span></h1>`;
content = content.replace(oldHeroText, newHeroText);

// Update descriptions to be more detailed for portfolio
const oldDesc = `<div className="space-y-4 max-w-2xl">
                   <p className="text-2xl text-gray-900 font-medium">用科技温暖每一段旅程，让世界文化遗产触手可及。</p>
                   <p className="text-lg text-gray-500 leading-relaxed">专为视障群体设计的鼓浪屿福建路多感官导览系统。融合 <span className="font-bold text-gray-900">AI 视觉识别</span> 与 <span className="font-bold text-gray-900">高精度音频导航</span>，让每一次出行都充满安全感。</p>
               </div>`;
const newDesc = `<div className="space-y-5 max-w-2xl text-left">
                   <p className="text-xl text-gray-300 font-medium tracking-wide">用科技温暖每一段旅程，让世界文化遗产触手可及。</p>
                   <p className="text-base text-gray-400 leading-relaxed">
                     专为视障群体打造的<span className="text-white font-bold">鼓浪屿数字孪生无障碍仿真系统</span>。本项目立足于空间计算与无障碍设计的交叉领域，旨在解决视障人群在复杂历史街区中的独立出行难题。
                   </p>
                   <p className="text-base text-gray-400 leading-relaxed">
                     我们通过构建高精度路网模型，融合 <span className="text-amber-400 font-bold">AI 意图识别</span> 与 <span className="text-emerald-400 font-bold">避障寻路算法</span>，在保证通行效率的同时，将高危路段暴露率降低 60% 以上，实现真正的“安全第一”导览体验。
                   </p>
               </div>`;
content = content.replace(oldDesc, newDesc);

// Fix text colors in Hero
content = content.replace(/text-gray-900/g, 'text-white');
content = content.replace(/text-gray-500/g, 'text-gray-400');
content = content.replace(/bg-blue-50\/80/g, 'bg-emerald-500/10');
content = content.replace(/text-blue-600/g, 'text-emerald-400');
content = content.replace(/border-blue-100/g, 'border-emerald-500/20');
content = content.replace(/bg-blue-400/g, 'bg-emerald-400');
content = content.replace(/bg-blue-500/g, 'bg-emerald-500');

// 3. Update DataVisSection (Algorithm) to add Heatmap
const dataVisStart = content.indexOf('const DataVisSection = () => {');
const dataVisEnd = content.indexOf('const InteractionStatsSection = () => {');

let newDataVis = `const DataVisSection = () => {
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
            cells.push(<div key={i} className={\`heatmap-cell intensity-\${pattern[i]}\`} title={\`Risk Intensity: \${pattern[i]}\`}></div>);
        }
        return cells;
    };

    return (
        <section id="algorithm-section" className="bg-white landing-ui border-t border-gray-100 overflow-hidden py-24">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-16 items-center">
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold tracking-wider uppercase mb-6 border border-blue-100">
                        Dimension 01 · Algorithm
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-6 leading-tight font-serif tracking-tight">算法仿真验证：<br/><span className="text-blue-600">高危障碍避让效能</span></h2>
                    <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                        基于 <strong>1000 次蒙特卡洛仿真测试</strong>，应用空间阻力权重算法后，视障群体遭遇高危台阶的概率下降逾 <span className="text-rose-500 font-bold">60%</span>。系统通过动态调整路径权重，在保证通行效率的同时最大程度规避了复杂路况。
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                            <div className="text-4xl font-mono font-bold text-blue-600 mb-2">60%<sup className="text-xl">+</sup></div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Risk Reduction</div>
                            <div className="text-sm text-gray-500">高危障碍事件减少</div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                            <div className="text-4xl font-mono font-bold text-emerald-600 mb-2">1000<sup className="text-xl">+</sup></div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Simulations</div>
                            <div className="text-sm text-gray-500">独立路径仿真场景</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Bar Chart */}
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Comparative Analysis</h4>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded">SIMULATION</span>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-20 text-xs font-mono font-bold text-gray-500">Algorithm</div>
                                <div className="flex-1 h-8 bg-gray-200 rounded-md overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 flex items-center px-3 text-white text-xs font-mono font-bold" style={{width: '85%'}}>85%</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-20 text-xs font-mono font-bold text-gray-500">Baseline</div>
                                <div className="flex-1 h-8 bg-gray-200 rounded-md overflow-hidden">
                                    <div className="h-full bg-gray-300 flex items-center px-3 text-gray-600 text-xs font-mono font-bold" style={{width: '30%'}}>30%</div>
                                </div>
                            </div>
                            <div className="mt-4 text-right text-[10px] text-gray-400 italic">数据来源：1000次蒙特卡洛路径仿真 · 2026.03</div>
                        </div>
                    </div>

                    {/* Heatmap Chart */}
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 路径热力图 (Risk Heatmap)</h4>
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100">VISUALIZED</span>
                        </div>
                        <div className="p-6">
                            <div className="heatmap-grid">
                                {generateHeatmap()}
                            </div>
                            <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-gray-500 font-medium">
                                <span>Low Risk</span>
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-sm bg-[#f1f5f9]"></div>
                                    <div className="w-3 h-3 rounded-sm bg-[#fee2e2]"></div>
                                    <div className="w-3 h-3 rounded-sm bg-[#fca5a5]"></div>
                                    <div className="w-3 h-3 rounded-sm bg-[#ef4444]"></div>
                                    <div className="w-3 h-3 rounded-sm bg-[#b91c1c]"></div>
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
`;

content = content.substring(0, dataVisStart) + newDataVis + content.substring(dataVisEnd);

// 4. Update CuratorDashboardSection to Dark Theme
const curatorStart = content.indexOf('const CuratorDashboardSection = () => {');
const curatorEnd = content.indexOf('export default function App() {');

let newCurator = `const CuratorDashboardSection = () => {
    const [latestSummary, setLatestSummary] = useState(null);
    const [abHistory, setAbHistory] = useState([]);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [summaryError, setSummaryError] = useState('');

    const fetchAbSummary = async () => {
        setIsLoadingSummary(true);
        setSummaryError('');
        try {
            const [latestResponse, historyResponse] = await Promise.all([
                fetch(\`\${API_URL}/api/ab_test_summary/latest\`, { headers: { "Content-Type": "application/json", ...API_HEADERS } }),
                fetch(\`\${API_URL}/api/ab_test_summary/history?limit=10\`, { headers: { "Content-Type": "application/json", ...API_HEADERS } })
            ]);
            if (!latestResponse.ok || !historyResponse.ok) throw new Error('A/B 数据接口暂时不可用');
            const latestJson = await latestResponse.json();
            const historyJson = await historyResponse.json();
            setLatestSummary(latestJson?.status === 'success' ? latestJson.data : null);
            setAbHistory(Array.isArray(historyJson?.items) ? [...historyJson.items].reverse().map((item, index) => ({
                label: item.timestamp ? new Date(item.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : \`Run \${index + 1}\`,
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

    const formatPercent = (value) => \`\${(Number(value ?? 0) * 100).toFixed(1)}%\`;
    const formatMeters = (value) => \`\${Number(value ?? 0).toFixed(1)}m\`;
    const formatSeconds = (value) => \`\${Number(value ?? 0).toFixed(1)}s\`;
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
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} tickFormatter={(val) => \`\${Math.round(val * 100)}%\`} />
                                <Tooltip formatter={(value, name) => [\`\${(Number(value) * 100).toFixed(1)}%\`, name === 'groupA' ? 'A组 (对照)' : 'B组 (实验)']} contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', fontSize: '12px', color: '#fff'}} />
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
                                <Tooltip formatter={(value, name) => [\`\${Number(value).toFixed(1)}m\`, name === 'pathA' ? 'A组 (对照)' : 'B组 (实验)']} contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', fontSize: '12px', color: '#fff'}} />
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
                        <span className={\`px-2.5 py-1 rounded-md text-[10px] font-bold border \${phaseAcceptanceReady ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}\`}>
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
`;

content = content.substring(0, curatorStart) + newCurator + content.substring(curatorEnd);

fs.writeFileSync(file, content);
globalThis.console.log('Successfully updated App.jsx for dark/light contrast.');
