type GlobalFunction = (...args: any[]) => void;
declare class HybridAppBridge {
    sendToApp(method: string, data?: any): void;
    registerGlobalFunction(name: string, func: GlobalFunction): void;
    removeGlobalFunction(name: string): void;
}
declare const _default: HybridAppBridge;
export default _default;
//# sourceMappingURL=HybridAppBridge.d.ts.map