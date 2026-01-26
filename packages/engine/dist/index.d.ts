import { WorkloadSegment } from './types';
export interface RendererCapabilities {
    id: string;
    name: string;
    supportedGenerators: string[];
    maxResolution: {
        width: number;
        height: number;
    };
    costTier: 'low' | 'med' | 'high';
}
export declare class VJEngine {
    private currentState;
    private grid;
    private width;
    private height;
    private registeredRenderers;
    constructor(width?: number, height?: number);
    registerRenderer(capabilities: RendererCapabilities): void;
    getCapabilities(): RendererCapabilities[];
    private initGrid;
    applyWorkload(workload: WorkloadSegment): void;
    private drawUI;
    update(): void;
    getGrid(): string[][];
}
