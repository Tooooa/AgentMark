import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import type { Step } from '../../data/mockData';
import { Brain, Terminal, EyeOff, RotateCcw, ArrowRight, Activity, Bot } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import StepDetailModal from './StepDetailModal';

interface StepCardProps {
    step: Step;
    isErased: boolean;
    showWatermarkDetails?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 text-white text-xs p-2 rounded shadow-lg border border-slate-700">
                <p className="font-bold mb-1">{payload[0].payload.name}</p>
                <p>Prob: {(payload[0].value * 100).toFixed(1)}%</p>
            </div>
        );
    }
    return null;
};

const StepCard: React.FC<StepCardProps> = ({ step, isErased, showWatermarkDetails = true }) => {
    const { t } = useI18n();
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    if (isErased) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex gap-4 p-2 opacity-50"
            >
                <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                        <EyeOff size={18} />
                    </div>
                </div>
                <div className="flex-1 rounded-xl border border-rose-200 bg-rose-50/50 p-4 min-h-[80px] flex items-center gap-4 relative overflow-hidden">
                    {/* Glitch Effect Elements */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mixed-blend-overlay"></div>
                    <span className="font-mono font-bold text-rose-500 tracking-[0.2em] text-xs">{t('logDestroyed')}</span>
                    <span className="font-mono text-[10px] text-rose-400">ID: #{step.stepIndex} :: ERASURE</span>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 group"
        >
            {/* Avatar Column */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-2">
                <div className="w-10 h-10 rounded-full bg-indigo-600 shadow-md shadow-indigo-200 flex items-center justify-center text-white z-10 relative">
                    <Bot size={20} />

                    {/* Step Badge */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                        {step.stepIndex}
                    </div>
                </div>
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0 space-y-4">

                {/* Header Row (Optional - maybe redundant with bubble headers) */}
                {/* <div className="flex items-center gap-2 text-xs text-slate-400 pl-1">
                    <span className="font-mono font-bold">AgentMark Model</span>
                    <span>•</span>
                    <span>{step.stepType.toUpperCase()}</span>
                </div> */}

                {/* 1. THOUGHT + CHARTS Block */}
                <div className="bg-white rounded-2xl rounded-tl-none border border-slate-100 shadow-sm p-5 relative overflow-hidden">
                    {/* Step Badge inside header */}
                    <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-mono text-xs font-bold">
                                {step.stepIndex}
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('step')} #{step.stepIndex}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${step.stepType === 'finish' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-500'}`}>
                            {step.stepType}
                        </span>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* LEFT: THOUGHT */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <Brain size={14} /> THOUGHT
                            </div>
                            <p className="text-sm text-slate-700 italic leading-relaxed font-serif pl-2 border-l-2 border-slate-100">
                                {step.thought || "Processing..."}
                            </p>
                        </div>

                        {/* RIGHT: WATERMARK CHARTS */}
                        {showWatermarkDetails && (
                            <div className="space-y-2 relative">
                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    <span>Differential Decoding</span>
                                    <span>Bins</span>
                                </div>
                                <div className="h-28 flex gap-3 items-center bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                                    {/* Chart 1 */}
                                    <div className="flex-1 h-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[...step.distribution].sort((a, b) => b.prob - a.prob)}>
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                                {/* Slicing Lines */}
                                                {[...step.distribution].sort((a, b) => b.prob - a.prob).map((d, i) => (
                                                    <ReferenceLine key={`line-${i}`} y={d.prob} stroke="#cbd5e1" strokeDasharray="3 3" />
                                                ))}
                                                <Bar dataKey="prob" radius={[2, 2, 0, 0]}>
                                                    {[...step.distribution].sort((a, b) => b.prob - a.prob).map((entry, index) => (
                                                        <Cell key={`c-${index}`} fill={entry.isSelected ? '#818cf8' : '#e2e8f0'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <ArrowRight size={12} className="text-slate-300" />

                                    {/* Chart 2: Bins */}
                                    {(() => {
                                        const sortedDist = [...step.distribution].sort((a, b) => b.prob - a.prob);
                                        const bins = sortedDist.map((d, i) => {
                                            const nextProb = sortedDist[i + 1]?.prob || 0;
                                            return {
                                                name: `T_${i + 1}`,
                                                weight: (i + 1) * (d.prob - nextProb),
                                                isTarget: d.isSelected
                                            };
                                        }).filter(b => b.weight > 0.001);

                                        return (
                                            <div className="flex-1 h-full relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={bins}>
                                                        <Tooltip cursor={{ fill: 'transparent' }} content={() => null} />
                                                        <Bar dataKey="weight" radius={[2, 2, 0, 0]}>
                                                            {bins.map((e, idx) => (
                                                                <Cell key={`b-${idx}`} fill={e.isTarget ? '#6366f1' : '#cbd5e1'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                                <button onClick={() => setIsDetailOpen(true)} className="absolute top-0 right-0 p-1 hover:bg-white rounded shadow-sm transition-colors text-indigo-500">
                                                    <RotateCcw size={10} />
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Pipeline Footer */}
                                <div className="bg-indigo-50/50 rounded-lg p-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono border border-indigo-50">
                                    <div className="flex items-center gap-1.5">
                                        <div className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                                            PAYLOAD {step.watermark.bits}
                                        </div>
                                        <span>Sort & Slice</span>
                                        <ArrowRight size={8} />
                                        <span>Select Bin <span className="text-indigo-600 font-bold">T_{step.distribution.findIndex(x => x.isSelected) + 1}</span></span>
                                        <ArrowRight size={8} />
                                        <RotateCcw size={8} />
                                        <span>Sample</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. ACTION Block */}
                <div className="space-y-1 pl-4 border-l-2 border-slate-200 ml-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <Terminal size={14} /> ACTION
                    </div>
                    <div className="bg-slate-100 rounded-xl p-4 font-mono text-sm text-slate-800 shadow-sm border border-slate-200">
                        {step.action}
                    </div>
                </div>

                {/* 3. OBSERVATION Block (if tool output) */}
                {step.stepType === 'tool' && (
                    <div className="space-y-1 pl-4 border-l-2 border-slate-200 ml-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <Activity size={14} /> ENVIRONMENT
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs text-slate-600 shadow-sm border border-slate-200 max-h-40 overflow-y-auto custom-scrollbar">
                            {/* Truncate or formatted observation */}
                            {step.toolDetails || "No observation data."}
                            {/* Note: In mockData, 'toolDetails' might not be populated or is observation? Check mockData logic. */}
                            {/* Checking parseToolBenchData... observation is in tool trace but parsed into 'steps' differently? */}
                            {/* Step type def has toolDetails? */}
                        </div>
                    </div>
                )}

                <StepDetailModal
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    step={step}
                />
            </div>
        </motion.div>
    );
};

export default StepCard;
