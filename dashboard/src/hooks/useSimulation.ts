import { useState, useEffect, useMemo } from 'react';
// import type { Trajectory } from '../types'; // Keep for type safety if needed, or remove if truly unused. 
// Actually, let's keep it but suppress if needed, or better, remove it if I am sure.
// Wait, I see no explicit usage in the file I viewed.
// Let's remove it.
import { useErasure } from './useErasure';
import { useEvaluation } from './useEvaluation';
import { useLiveSession } from './useLiveSession';
import { useHistory } from './useHistory';

export const useSimulation = () => {
    const [activeScenarioId, setActiveScenarioId] = useState<string>('empty-initial');

    // 1. History Hook
    const {
        savedScenarios,
        setSavedScenarios,
        refreshScenarios,
        deleteScenario,
        clearAllHistory,
        batchDeleteScenarios,
        togglePin
    } = useHistory();

    // 2. Live Session Hook
    const {
        apiKey, setApiKey,
        sessionId, setSessionId,
        liveScenario, setLiveScenario,
        isLoading, setIsLoading,
        isPlaying, setIsPlaying,
        currentStepIndex, setCurrentStepIndex,
        handleInitSession,
        handleNext,
        handlePrev,
        handleReset,
        handleContinue,
        handleNewConversation,
        customQuery, setCustomQuery,
        payload, setPayload
    } = useLiveSession(
        activeScenarioId,
        setActiveScenarioId,
        refreshScenarios
    );

    // 3. Erasure Hook
    const {
        erasureRate,
        setErasureRate,
        erasedIndices
    } = useErasure(currentStepIndex);

    // 4. Evaluation Hook
    const {
        evaluationResult,
        isEvaluating,
        isEvaluationModalOpen,
        setEvaluationResult,
        setIsEvaluationModalOpen,
        evaluateSession
    } = useEvaluation();

    // Sync liveScenario to savedScenarios for real-time updates in history list
    useEffect(() => {
        if (liveScenario && liveScenario.id) {
            setSavedScenarios(prev => {
                const index = prev.findIndex(s => s.id === liveScenario.id);
                if (index >= 0) {
                    const updated = [...prev];
                    updated[index] = liveScenario;
                    return updated;
                }
                return prev;
            });
        }
    }, [liveScenario, setSavedScenarios]);

    // Evaluation Sync
    useEffect(() => {
        if (activeScenarioId && activeScenarioId === liveScenario?.id) {
            setLiveScenario(prev => prev ? ({ ...prev, evaluation: evaluationResult || undefined }) : null);
        }
    }, [evaluationResult, activeScenarioId, liveScenario?.id, setLiveScenario]);


    const allScenarios = useMemo(() => {
        return [...savedScenarios];
    }, [savedScenarios]);

    const activeScenario = useMemo(() => {
        if (!activeScenarioId) {
            return {
                id: '',
                title: { en: 'No Conversation', zh: '无对话' },
                taskName: '',
                userQuery: '',
                totalSteps: 0,
                steps: []
            };
        }
        if (liveScenario && liveScenario.id === activeScenarioId) {
            return liveScenario;
        }
        const found = allScenarios.find(s => s.id === activeScenarioId);
        if (found) {
            return found;
        }
        // If we have a liveScenario but ID doesn't match, still use it if it's the expected one?
        // Prioritize live scenario if standard logic fails but user is in session?
        // Stick to activeScenarioId matching.

        return {
            id: 'empty-initial',
            title: { en: 'New Session', zh: '新会话' },
            taskName: 'New Session',
            userQuery: '',
            totalSteps: 0,
            steps: []
        };
    }, [activeScenarioId, liveScenario, allScenarios]);


    // Auto-load history when clicking on a saved scenario
    useEffect(() => {
        const loadHistoryScenario = async () => {
            const clickedScenario = savedScenarios.find(s => s.id === activeScenarioId);

            if (clickedScenario && clickedScenario.steps.length > 0) {
                if (!liveScenario || liveScenario.id !== activeScenarioId) {
                    setLiveScenario({
                        ...clickedScenario,
                        id: activeScenarioId
                    });
                    setCurrentStepIndex(clickedScenario.steps.length);
                    setIsPlaying(false);
                    setSessionId(activeScenarioId); // Allow continuing

                    if (clickedScenario.evaluation) {
                        setEvaluationResult(clickedScenario.evaluation);
                    } else {
                        setEvaluationResult(null);
                    }
                }
            }
        };
        loadHistoryScenario();
    }, [activeScenarioId, savedScenarios, liveScenario, setLiveScenario, setCurrentStepIndex, setIsPlaying, setSessionId, setEvaluationResult]);

    // Sync evaluation result to local state when active scenario changes
    useEffect(() => {
        if (activeScenario && activeScenario.evaluation) {
            setEvaluationResult(activeScenario.evaluation);
        } else {
            // Avoid clearing if we are just updating the same scenario's steps
            // Only clear if scenario ID changed
            // But here activeScenario changes on every step update too.
            // Rely on loadHistoryScenario for initial load.
        }
    }, [activeScenario, setEvaluationResult]);


    // History Management Wrappers
    const handleDeleteScenario = async (id: string) => {
        await deleteScenario(id);
        if (activeScenarioId === id) {
            // Logic moved from old useSimulation
            const remaining = savedScenarios.filter(s => s.id !== id);
            if (remaining.length > 0) {
                setActiveScenarioId(remaining[0].id);
            } else {
                handleNewConversation(); // Create new
            }
        }
        await refreshScenarios();
    };

    const handleClearAllHistory = async () => {
        await clearAllHistory();
        await handleNewConversation();
        await refreshScenarios();
    };

    const handleBatchDelete = async (ids: string[]) => {
        const result = await batchDeleteScenarios(ids);
        if (ids.includes(activeScenarioId)) {
            handleNewConversation();
        }
        await refreshScenarios();
        return result;
    };

    // History View State
    const [isHistoryViewOpen, setIsHistoryViewOpen] = useState(false);
    const [isComparisonMode, setIsComparisonMode] = useState(false);


    return {
        scenarios: allScenarios,
        activeScenario,
        activeScenarioId,
        setActiveScenarioId,
        refreshScenarios,
        isPlaying,
        setIsPlaying,
        currentStepIndex,
        erasureRate,
        setErasureRate,
        erasedIndices,
        handleReset,
        handleNext,
        handlePrev,
        visibleSteps: activeScenario.steps.slice(0, currentStepIndex),

        isComparisonMode,
        setIsComparisonMode,

        apiKey,
        setApiKey,
        handleInitSession,
        isLoading,
        setIsLoading,
        customQuery,
        setCustomQuery,
        payload,
        setPayload,
        sessionId,

        isHistoryViewOpen,
        setIsHistoryViewOpen,

        handleContinue,
        handleNewConversation,

        evaluationResult,
        isEvaluating,
        isEvaluationModalOpen,
        setIsEvaluationModalOpen,
        evaluateSession: (lang?: string, force?: boolean) => evaluateSession(sessionId || activeScenarioId, lang, force),

        deleteScenario: handleDeleteScenario,
        clearAllHistory: handleClearAllHistory,
        batchDeleteScenarios: handleBatchDelete,
        togglePin
    };
};