
import axios from 'axios';

const API_BASE = '/api';

export interface Scenario {
    id: string;
    query: string;
}

export interface StepResponse {
    thought: string;
    action: string;
    observation: string;
    done: boolean;
    watermark?: {
        bits: string;
        matrixRows: number[][];
        rankContribution: number;
    };
    distribution?: {
        name: string;
        prob: number;
        isSelected: boolean;
    }[];
    stepIndex: number;
}

export const api = {
    async restoreSession(apiKey: string, scenarioId: string) {
        const res = await axios.post(`${API_BASE}/api/restore_session`, {
            apiKey,
            scenarioId
        });
        return res.data;
    },

    initSession: async (apiKey: string, scenarioId: string, payload: string) => {
        const response = await axios.post(`${API_BASE}/init`, { apiKey, scenarioId, payload });
        return response.data; // { sessionId, task, totalSteps }
    },

    initCustomSession: async (apiKey: string, query: string, payload: string) => {
        const response = await axios.post(`${API_BASE}/init_custom`, { apiKey, query, payload });
        return response.data; // { sessionId, task, totalSteps }
    },

    step: async (sessionId: string): Promise<StepResponse> => {
        const response = await axios.post(`${API_BASE}/step`, { sessionId });
        return response.data;
    },

    continueSession: async (sessionId: string, prompt: string) => {
        const response = await axios.post(`${API_BASE}/continue`, { sessionId, prompt });
        return response.data;
    },

    listScenarios: async (): Promise<any[]> => {
        const response = await axios.get(`${API_BASE}/scenarios`);
        return response.data;
    },

    saveScenario: async (title: any, data: any, id?: string) => {
        const response = await axios.post(`${API_BASE}/save_scenario`, { title, data, id });
        return response.data; // { status: "success", id: "..." }
    },

    stepStream: async (sessionId: string, onChunk: (data: any) => void): Promise<void> => {
        const response = await fetch(`${API_BASE}/step`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        });

        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const json = JSON.parse(line);
                        onChunk(json);
                    } catch (e) {
                        console.error("Stream parse error", e);
                    }
                }
            }
        }
    },

    generateTitle: async (history: any[]) => {
        const response = await axios.post(`${API_BASE}/generate_title`, { history });
        return response.data; // { title: string }
    },

    evaluateSession: async (sessionId: string, language: string = "en") => {
        const response = await axios.post(`${API_BASE}/evaluate`, { sessionId, language });
        return response.data;
    }
};
