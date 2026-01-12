
// Mock data removed - using database only

// --- Types ---

export type DistributionItem = {
    name: string;
    prob: number;
    isSelected: boolean;
};

export type StepWatermark = {
    bits: string;
    matrixRows: number[][]; // Changed to support multiple rows per step
    rankContribution: number;
};

export type Step = {
    stepIndex: number;
    thought: string;
    action: string;
    toolDetails?: string;
    distribution: DistributionItem[];
    watermark: StepWatermark;
    stepType: 'tool' | 'finish' | 'user_input' | 'other';
    metrics?: {
        latency: number;
        tokens: number;
    };
    finalAnswer?: string;
    isHidden?: boolean;
    // New field for Comparison Mode (Dual Agent)
    baseline?: {
        thought: string;
        action: string;
        toolDetails?: string;
        distribution: DistributionItem[];
        stepType: 'tool' | 'finish' | 'user_input' | 'other';
        finalAnswer?: string;
        metrics?: {
            latency: number;
            tokens: number;
        };
        isHidden?: boolean;
    };
};

export type Trajectory = {
    id: string;
    title: {
        en: string;
        zh: string;
    };
    taskName: string; // Legacy support or internal ID
    userQuery: string;
    totalSteps: number;
    steps: Step[];
    evaluation?: { model_a_score: number, model_b_score: number, reason: string };
};

// --- Helper Functions ---

const generateRandomMatrixRow = (seed: number, length: number = 16): number[] => {
    const row = [];
    for (let i = 0; i < length; i++) {
        // Simple deterministic random based on seed
        const x = Math.sin(seed + i) * 10000;
        row.push((x - Math.floor(x)) > 0.5 ? 1 : 0);
    }
    return row;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// --- Exports ---

// Mock scenarios removed - using database only
export const scenarios: Trajectory[] = [];
