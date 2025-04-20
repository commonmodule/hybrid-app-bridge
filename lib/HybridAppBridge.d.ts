declare class HybridAppBridge {
    private pending;
    private streams;
    constructor();
    isHybridApp(): boolean;
    invoke<T>(method: string, ...args: any[]): Promise<T>;
    invokeStream<T>(method: string, ...args: any[]): AsyncIterable<T>;
}
declare const _default: HybridAppBridge;
export default _default;
//# sourceMappingURL=HybridAppBridge.d.ts.map