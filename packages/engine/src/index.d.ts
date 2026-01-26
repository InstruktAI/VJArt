import { WorkloadSegment } from './types';
export declare class VJEngine {
    private currentState;
    private grid;
    private width;
    private height;
    constructor(width?: number, height?: number);
    private initGrid;
    applyWorkload(workload: WorkloadSegment): void;
    update(): void;
    getGrid(): string[][];
}
