import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Activity, Zap, Columns, PlusCircle, Save, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Trajectory } from '../../data/mockData';
import { useI18n } from '../../i18n/I18nContext';

interface ControlPanelProps {
    scenarios: Trajectory[];
    activeScenarioId: string;
    onSelectScenario: (id: string) => void;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onReset: () => void;
    onNext: () => void;
    onPrev: () => void;
    erasureRate: number;
    setErasureRate: (val: number) => void;
    currentStep: number;
    totalSteps: number;
    isLiveMode?: boolean;
    onToggleLiveMode?: () => void;
    apiKey?: string;
    setApiKey?: (key: string) => void;
    onInitSession?: () => void;
    isComparisonMode?: boolean;
    onToggleComparisonMode?: () => void;
    liveStats?: {
        avgLatency: number;
        avgTokens: number;
    };
    currentScenario?: Trajectory;
    onSave?: () => void;
    onNew?: () => void;
    onEvaluate?: (lang: string) => void;
    isEvaluating?: boolean;
    evaluationResult?: { model_a_score: number, model_b_score: number, reason: string } | null; // New prop
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    scenarios,
    activeScenarioId,
    onSelectScenario,
    isPlaying,
    onTogglePlay,
    onReset,
    onNext,
    onPrev,
    currentStep,
    totalSteps,
    isComparisonMode,
    onToggleComparisonMode,
    isLiveMode,
    // @ts-ignore
    onToggleLiveMode,
    // @ts-ignore
    liveStats,
    currentScenario,
    onSave,
    onNew,
    onEvaluate,
    isEvaluating,
    evaluationResult // New prop
}) => {
    const { t, locale, setLocale } = useI18n();

    const activeScenario = currentScenario || scenarios.find(s => s.id === activeScenarioId);

    const chartData = React.useMemo(() => {
        const data = activeScenario?.steps.map(s => ({
            step: s.stepIndex,
            tokens: s.metrics?.tokens ?? null,
            latency: s.metrics?.latency ?? null,
            baseTokens: s.baseline?.metrics?.tokens ?? null,
            baseLatency: s.baseline?.metrics?.latency ?? null
        })) || [];

        if (data.length === 0) {
            data.push({ step: 0, tokens: null, latency: null, baseTokens: null, baseLatency: null });
        }
        return data;
    }, [activeScenario]);

    // -- Live Mode Layout -- 
    if (isLiveMode) {
        return (
            <div className="flex flex-col h-full gap-4 text-slate-800">

                {/* 1. New Conversation Button (Light Theme) */}
                {!isComparisonMode && (
                    <button
                        onClick={onNew}
                        className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-700 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 font-medium tracking-wide group"
                    >
                        <PlusCircle size={18} className="text-indigo-500 group-hover:text-indigo-600" />
                        {locale === 'zh' ? '新对话' : 'New Chat'}
                    </button>
                )}

                {/* 2. History List (Reduced Height) */}
                {!isComparisonMode && (
                    <div className="h-60 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col shrink-0">
                        <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {locale === 'zh' ? '历史记录' : 'History'}
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                            {scenarios.slice().reverse().map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => onSelectScenario(s.id)}
                                    className={`w-full text-left p-3 rounded-lg text-sm transition-all group ${activeScenarioId === s.id
                                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="line-clamp-1 leading-relaxed">
                                        {locale === 'zh' ? (s.title.zh || s.title.en) : s.title.en}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span>{s.steps.length} turns</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="p-2 border-t border-slate-50 text-center">
                            <button className="text-[10px] text-slate-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-1 transition-colors">
                                View all history <span>→</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Toggles & Utility Monitor (Expanded) */}
                <div className="flex-1 min-h-0 flex flex-col gap-4">
                    {/* Toggle (Light Theme) */}
                    <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200/60">
                        <button
                            onClick={onToggleComparisonMode}
                            className={`flex-1 py-2 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${!isComparisonMode
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <Activity size={14} /> STANDARD
                        </button>
                        <button
                            onClick={onToggleComparisonMode}
                            className={`flex-1 py-2 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${isComparisonMode
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <Columns size={14} /> COMPARE
                        </button>
                    </div>

                    {/* Evaluate Button (Compare Mode Only) */}
                    {isComparisonMode && (
                        <>
                            <button
                                onClick={() => onEvaluate && onEvaluate(locale)}
                                disabled={isEvaluating}
                                className={`w-full py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${isEvaluating
                                    ? 'bg-indigo-50 text-indigo-400 cursor-wait'
                                    : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-200 hover:shadow-indigo-300'
                                    }`}
                            >
                                {isEvaluating ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-indigo-200 border-t-white rounded-full animate-spin"></div>
                                        Evaluating...
                                    </>
                                ) : (
                                    <>
                                        <Award size={14} className="text-amber-300" />
                                        Evaluate Agents
                                    </>
                                )}
                            </button>

                            {/* Evaluation Summary Overview */}
                            {evaluationResult && (
                                <div className="bg-white rounded-lg border border-indigo-100 p-3 shadow-sm flex items-center justify-between">
                                    <div className="flex flex-col items-center flex-1 border-r border-indigo-50 last:border-0">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base</span>
                                        <div className="flex items-center text-sm font-bold text-slate-700">
                                            {evaluationResult.model_a_score.toFixed(1)}
                                            <span className="text-[10px] text-slate-400 ml-0.5">/10</span>
                                        </div>
                                    </div>

                                    {/* Center Logic: Visual Indicator or VS */}
                                    {/* <div className="text-[10px] font-bold text-indigo-200 px-2">VS</div> */}

                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Ours</span>
                                        <div className="flex items-center text-sm font-bold text-indigo-600">
                                            {evaluationResult.model_b_score.toFixed(1)}
                                            <span className="text-[10px] text-indigo-300 ml-0.5">/10</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Utility Monitor Card (Fills remaining space) */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col min-h-0">
                        <div className="flex items-center gap-2 text-indigo-900 border-b border-indigo-50 pb-2 mb-3 shrink-0">
                            <Activity size={16} />
                            <h3 className="font-bold text-xs uppercase tracking-wide">Utility Monitor</h3>
                        </div>

                        <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto pr-1">
                            {/* Token Chart */}
                            <div className="flex-1 min-h-[100px] flex flex-col">
                                <div className="flex justify-between items-center mb-1 shrink-0">
                                    <span className="text-[10px] font-semibold text-slate-500">Token Throughput</span>
                                    <div className="flex gap-2 text-[8px]">
                                        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Ours</span>
                                        <span className="flex items-center gap-0.5 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Base</span>
                                    </div>
                                </div>
                                <div className="flex-1 w-full min-h-0 overflow-hidden relative">
                                    <ResponsiveContainer width="99%" height="100%" debounce={50}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="step" hide />
                                            <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
                                            <Tooltip 
                                                contentStyle={{ fontSize: '10px' }} 
                                                itemStyle={{ padding: 0 }}
                                                wrapperStyle={{ zIndex: 1000 }}
                                                isAnimationActive={false}
                                            />
                                            <Line type="monotone" dataKey="baseTokens" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                                            <Line type="monotone" dataKey="tokens" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Latency Chart */}
                            <div className="flex-1 min-h-[100px] flex flex-col">
                                <div className="flex justify-between items-center mb-1 shrink-0">
                                    <span className="text-[10px] font-semibold text-slate-500">Step Latency (s)</span>
                                    <div className="flex gap-2 text-[8px]">
                                        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Ours</span>
                                        <span className="flex items-center gap-0.5 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Base</span>
                                    </div>
                                </div>
                                <div className="flex-1 w-full min-h-0 overflow-hidden relative">
                                    <ResponsiveContainer width="99%" height="100%" debounce={50}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="step" hide />
                                            <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
                                            <Tooltip 
                                                contentStyle={{ fontSize: '10px' }} 
                                                itemStyle={{ padding: 0 }}
                                                wrapperStyle={{ zIndex: 1000 }}
                                                isAnimationActive={false}
                                            />
                                            <Line type="monotone" dataKey="baseLatency" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                                            <Line type="monotone" dataKey="latency" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // -- Original Layout (Simulation Mode) --
    return (
        <div className="flex flex-col gap-6 h-full text-slate-800">
            {/* 1. Utility Monitor Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-900 border-b border-indigo-100 pb-2">
                    <Activity size={18} />
                    <h3 className="font-bold text-sm uppercase tracking-wide">Utility Monitor</h3>
                </div>

                {/* Token Cost Chart */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-500">Token Throughput</span>
                        <div className="flex gap-2 text-[10px]">
                            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-indigo-500"></span> Ours</span>
                            <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-0.5 bg-slate-300 border-t border-dashed border-slate-400"></span> Base</span>
                        </div>
                    </div>
                    <div className="h-32">
                        <ResponsiveContainer width="99%" height="100%" debounce={50}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="step" hide />
                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                                <Tooltip
                                    contentStyle={{ fontSize: '10px', borderRadius: '8px' }}
                                    itemStyle={{ padding: 0 }}
                                    wrapperStyle={{ zIndex: 1000 }}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="baseTokens"
                                    stroke="#cbd5e1"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={{ r: 2, fill: '#cbd5e1' }}
                                    activeDot={{ r: 4 }}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="tokens"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: '#6366f1' }}
                                    activeDot={{ r: 4 }}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Latency Chart */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-500">Step Latency (s)</span>
                        <div className="flex gap-2 text-[10px]">
                            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-rose-500"></span> Ours</span>
                            <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-0.5 bg-slate-300 border-t border-dashed border-slate-400"></span> Base</span>
                        </div>
                    </div>
                    <div className="h-32">
                        <ResponsiveContainer width="99%" height="100%" debounce={50}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="step" hide />
                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                                <Tooltip
                                    contentStyle={{ fontSize: '10px', borderRadius: '8px' }}
                                    itemStyle={{ padding: 0 }}
                                    wrapperStyle={{ zIndex: 1000 }}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="baseLatency"
                                    stroke="#cbd5e1"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={{ r: 2, fill: '#cbd5e1' }}
                                    activeDot={{ r: 4 }}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="latency"
                                    stroke="#f43f5e"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: '#f43f5e' }}
                                    activeDot={{ r: 4 }}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="flex-1"></div>

            {/* 2. Log Console / Playback Controls */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                    <span className="font-mono text-xs text-slate-400">LOG CONSOLE</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
                            className="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                        >
                            {locale === 'zh' ? 'EN' : '中文'}
                        </button>
                        <Zap size={14} className="text-amber-400" />
                    </div>
                </div>

                {/* Scenario Management Buttons (Live Mode Only or Always?) */}
                {/* User request: "Open new dialog button" + "Store current record button" */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={onNew}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs border border-slate-700 hover:border-slate-600"
                        title={locale === 'zh' ? "开启新对话" : "New Conversation"}
                    >
                        <PlusCircle size={14} />
                        {locale === 'zh' ? "新对话" : "New Chat"}
                    </button>
                    <button
                        onClick={onSave}
                        disabled={totalSteps === 0}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all text-xs border ${totalSteps === 0
                            ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed'
                            : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 hover:text-white border-indigo-500/30 hover:border-indigo-500/50'
                            }`}
                        title={locale === 'zh' ? "保存当前记录" : "Save Session"}
                    >
                        <Save size={14} />
                        {locale === 'zh' ? "保存" : "Save"}
                    </button>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 mb-4 bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={onToggleComparisonMode}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all ${!isComparisonMode ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                    >
                        <Activity size={12} /> Standard
                    </button>
                    <button
                        onClick={onToggleComparisonMode}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all ${isComparisonMode ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                    >
                        <Columns size={12} /> Compare
                    </button>
                </div>

                {/* Scenario Select (Compact) - Hidden in Live Mode */}
                {!isLiveMode && (
                    <div className="mb-4">
                        <select
                            className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg p-2 outline-none focus:border-indigo-500"
                            value={activeScenarioId}
                            onChange={(e) => onSelectScenario(e.target.value)}
                        >
                            {scenarios.map(s => (
                                <option key={s.id} value={s.id}>
                                    {locale === 'zh' ? s.title.zh : s.title.en}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Erasure Rate Slider - MOVED TO DECODER PANEL */}


                {/* Playback Buttons */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onPrev} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors" disabled={currentStep === 0}>
                        <SkipBack size={18} />
                    </button>

                    <button
                        onClick={onTogglePlay}
                        className={`p-3 rounded-full shadow-lg text-white transition-all active:scale-95 flex items-center justify-center ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>

                    <button onClick={onNext} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors" disabled={currentStep >= totalSteps}>
                        <SkipForward size={18} />
                    </button>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>STEP {currentStep}</span>
                        <span>{totalSteps} TOTAL</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1">
                        <div
                            className="bg-indigo-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / Math.max(totalSteps, 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="flex justify-center mt-4 pt-2 border-t border-slate-700/50">
                    <button onClick={onReset} className="text-[10px] flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        <RotateCcw size={10} /> {t('resetSimulation')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;
