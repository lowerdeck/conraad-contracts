export declare class Evaluator {
    private readonly data;
    private readonly options;
    constructor(data: Record<string, any>, options?: EvaluatorOptions);
    evaluateExpression<T>(expression: string): T | null;
    private validate;
    private evaluateNode;
}
export interface EvaluatorOptions {
    maxLen?: number;
    maxDepth?: number;
    maxNodes?: number;
    nullSafeMember?: boolean;
}
export interface EvaluateStructureOptions {
    onExpression?: (expression: string, evaluated: any) => void;
}
export declare class EvaluatorError extends Error {
    readonly expression: string;
    constructor(message: string, expression: string, cause?: unknown);
}
//# sourceMappingURL=evaluator.d.ts.map