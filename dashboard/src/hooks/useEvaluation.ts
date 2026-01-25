/**
 * Hook for managing evaluation state and operations.
 * Extracted from useSimulation for better separation of concerns.
 */
import { useState, useCallback } from 'react';
import { api } from '../services/api';


export interface EvaluationResult {
    model_a_score: number;
    model_b_score: number;
    reason: string;
}


export interface UseEvaluationReturn {
    evaluationResult: EvaluationResult | null;
    isEvaluating: boolean;
    isEvaluationModalOpen: boolean;
    setEvaluationResult: React.Dispatch<React.SetStateAction<EvaluationResult | null>>;
    setIsEvaluationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    evaluateSession: (sessionId: string, language?: string, force?: boolean) => Promise<EvaluationResult | null>;
}


export const useEvaluation = (): UseEvaluationReturn => {
    const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);

    const evaluateSession = useCallback(async (
        sessionId: string,
        language: string = "en",
        force: boolean = false
    ): Promise<EvaluationResult | null> => {
        if (!sessionId) {
            console.error('[Evaluate] No session ID provided');
            return null;
        }

        if (evaluationResult && !force) {
            setIsEvaluationModalOpen(true);
            return evaluationResult;
        }

        setIsEvaluating(true);
        setIsEvaluationModalOpen(true);

        try {
            console.log('[Evaluate] Evaluating session:', sessionId);
            const result = await api.evaluateSession(sessionId, language);
            console.log('[Evaluate] Evaluation result:', result);
            setEvaluationResult(result);
            return result;
        } catch (e: any) {
            console.error("Evaluation failed", e);
            const errorMsg = e.response?.data?.detail || e.message || "Unknown error";
            setIsEvaluationModalOpen(false);
            throw new Error(`Evaluation failed: ${errorMsg}`);
        } finally {
            setIsEvaluating(false);
        }
    }, [evaluationResult]);

    return {
        evaluationResult,
        isEvaluating,
        isEvaluationModalOpen,
        setEvaluationResult,
        setIsEvaluationModalOpen,
        evaluateSession,
    };
};
