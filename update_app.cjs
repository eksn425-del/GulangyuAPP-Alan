const fs = require('fs');
const file = 'e:/my-gulangyu/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

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
        <section id="curator-section" className="py-24 bg-[#f8fafc] landing-ui relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-100 rounded-full blur-[120px] opacity-60 pointer-events-none -mr-40 -mt-40"></div>
          <div className="container mx-auto px-6 relative z-10 max-w-7xl">
            <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-100/50 text-purple-700 rounded-full text-xs font-bold tracking-wider uppercase mb-4 border border-purple-200">
                        Dimension 03 · Curator Mode
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-4 leading-tight font-serif tracking-tight">策展人模式：<br/><em className="text-purple-600 not-italic">全域数据实时监控</em></h2>
                    <p className="text-base text-gray-500 max-w-xl leading-relaxed">A/B 实验数据看板，实时追踪 Group A（基线）与 Group B（优化）的风险率、路径长度与完成时间差异。</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Last Update</p>
                        <p className="font-mono text-sm text-gray-700 font-medium">{latestUpdateText}</p>
                    </div>
                    <button onClick={fetchAbSummary} className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2 text-sm font-bold">
                        <RefreshCw size={16} className={isLoadingSummary ? 'animate-spin text-purple-500' : 'text-purple-500'} /> 刷新数据
                    </button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('open-admin-panel'))} className="px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 shadow-md transition-all flex items-center gap-2 text-sm font-bold">
                        <Settings size={16} /> 管理终端
                    </button>
                </div>
            </div>

            {summaryError && (
                <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-red-600 text-sm flex items-center gap-3">
                    <AlertTriangle size={18} /> {summaryError}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400"></div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">Group A Hazard Rate</div>
                    <div className="text-4xl font-mono font-bold text-gray-900 mb-2">{latestSummary ? formatPercent(latestSummary.group_a_hazard_rate) : '--'}</div>
                    <div className="text-xs font-medium text-rose-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Baseline · 最短路策略</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">Group B Hazard Rate</div>
                    <div className="text-4xl font-mono font-bold text-gray-900 mb-2">{latestSummary ? formatPercent(latestSummary.group_b_hazard_rate) : '--'}</div>
                    <div className="text-xs font-medium text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Optimized · 安全路策略</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">Avg. Path Length</div>
                    <div className="text-4xl font-mono font-bold text-gray-900 mb-2">{latestSummary ? formatMeters(latestSummary.group_b_avg_path_length) : '--'}</div>
                    <div className="text-xs font-medium text-blue-600 flex items-center gap-1">A: {latestSummary ? formatMeters(latestSummary.group_a_avg_path_length) : '--'} / B: {latestSummary ? formatMeters(latestSummary.group_b_avg_path_length) : '--'}</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400"></div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">Avg. Completion Time</div>
                    <div className="text-4xl font-mono font-bold text-gray-900 mb-2">{latestSummary ? formatSeconds(latestSummary.group_b_avg_completion_time) : '--'}</div>
                    <div className="text-xs font-medium text-purple-600 flex items-center gap-1">A: {latestSummary ? formatSeconds(latestSummary.group_a_avg_completion_time) : '--'} / B: {latestSummary ? formatSeconds(latestSummary.group_b_avg_completion_time) : '--'}</div>
                </div>
            </div>

            {/* Bottom Panels - 3 Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-5">
                {/* Chart 1: Risk Rate */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-[320px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-gray-800 font-bold text-sm flex items-center gap-2"><Activity size={16} className="text-rose-500"/> 风险率 A/B 对比</h4>
                        <span className="text-[10px] font-bold bg-gray-50 text-gray-400 px-2 py-1 rounded border border-gray-100">RISK RATE</span>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => \`\${Math.round(val * 100)}%\`} />
                                <Tooltip formatter={(value, name) => [\`\${(Number(value) * 100).toFixed(1)}%\`, name === 'groupA' ? 'A组 (对照)' : 'B组 (实验)']} contentStyle={{backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} formatter={(value) => <span className="text-gray-600 font-medium ml-1">{value === 'groupA' ? 'A组 (最短路)' : 'B组 (安全路)'}</span>} />
                                <Line type="monotone" dataKey="groupA" stroke="#fb7185" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
                                <Line type="monotone" dataKey="groupB" stroke="#34d399" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Path Length */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-[320px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-gray-800 font-bold text-sm flex items-center gap-2"><MapPin size={16} className="text-blue-500"/> 路径长度对比</h4>
                        <span className="text-[10px] font-bold bg-gray-50 text-gray-400 px-2 py-1 rounded border border-gray-100">DISTANCE (m)</span>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <Tooltip formatter={(value, name) => [\`\${Number(value).toFixed(1)}m\`, name === 'pathA' ? 'A组 (对照)' : 'B组 (实验)']} contentStyle={{backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} formatter={(value) => <span className="text-gray-600 font-medium ml-1">{value === 'pathA' ? 'A组 (最短路)' : 'B组 (安全路)'}</span>} />
                                <Bar dataKey="pathA" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="pathB" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Result Card */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] h-[320px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <BarChart3 size={100} />
                    </div>
                    <div className="flex items-center justify-between mb-5 relative z-10">
                        <h4 className="text-gray-800 font-bold text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> 实验验收结果</h4>
                        <span className={\`px-2.5 py-1 rounded-md text-[10px] font-bold border \${phaseAcceptanceReady ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}\`}>
                            {phaseAcceptanceReady ? '✓ READY' : 'PENDING'}
                        </span>
                    </div>
                    
                    <div className="space-y-3 relative z-10 flex-1">
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                            <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Test Run ID</div>
                            <div className="font-mono text-xs text-gray-700 font-medium break-all">{latestSummary?.test_run_id || 'Waiting for data...'}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex-1">
                            <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">Acceptance Criteria</div>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-gray-600 font-medium">B组风险率 &lt; A组 70%</span>
                                    <span className={latestSummary && Number(latestSummary.group_b_hazard_rate ?? 0) < Number(latestSummary.group_a_hazard_rate ?? 0) * 0.7 ? 'text-emerald-600 font-bold font-mono' : 'text-amber-500 font-bold font-mono'}>{latestSummary && Number(latestSummary.group_b_hazard_rate ?? 0) < Number(latestSummary.group_a_hazard_rate ?? 0) * 0.7 ? 'PASS' : 'FAIL'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-gray-600 font-medium">B组路径长度 &ge; A组</span>
                                    <span className={latestSummary && Number(latestSummary.group_b_avg_path_length ?? 0) >= Number(latestSummary.group_a_avg_path_length ?? 0) ? 'text-emerald-600 font-bold font-mono' : 'text-amber-500 font-bold font-mono'}>{latestSummary && Number(latestSummary.group_b_avg_path_length ?? 0) >= Number(latestSummary.group_a_avg_path_length ?? 0) ? 'PASS' : 'FAIL'}</span>
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
`

content = content.substring(0, curatorStart) + newCurator + content.substring(curatorEnd);

// Modify Hero part
// Find: <div className="min-h-screen bg-[var(--bg-color)]
content = content.replace(
    /<div className="min-h-screen bg-\[var\(--bg-color\)\]/g, 
    '<div className="min-h-screen bg-[#f8fafc]'
);
content = content.replace(/bg-\[#f4f1ea\]/g, 'bg-[#f8fafc]');

// Enhance the hero text:
// Replace the huge h1
const oldH1 = `<h1 className="text-6xl lg:text-8xl font-black text-gray-900 leading-none tracking-tighter mb-4">听见·鼓浪屿<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 text-3xl lg:text-5xl block mt-6 font-bold tracking-tight drop-shadow-sm">多感知无障碍导航系统</span></h1>`;
const newH1 = `<h1 className="text-6xl lg:text-8xl font-black text-gray-900 leading-none tracking-tighter mb-4 font-serif">听见·<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400 drop-shadow-sm">鼓浪屿</span><br/><span className="text-gray-400 text-3xl lg:text-4xl block mt-6 font-bold tracking-tight font-sans">多感知无障碍导航系统</span></h1>`;

content = content.replace(oldH1, newH1);

fs.writeFileSync(file, content);
globalThis.console.log('Successfully updated App.jsx');
