class HybridAppBridge {
    sendToApp(method, data) {
        if (window.messageHandler) {
            window.messageHandler.postMessage(JSON.stringify({ method, data }));
        }
    }
    registerGlobalFunction(name, func) {
        if (typeof window[name] !== "undefined") {
            console.warn(`A global function named '${name}' already exists. It will be overwritten.`);
        }
        window[name] = func;
    }
    removeGlobalFunction(name) {
        if (typeof window[name] === "function") {
            delete window[name];
        }
        else {
            console.warn(`No global function named '${name}' exists.`);
        }
    }
}
export default new HybridAppBridge();
//# sourceMappingURL=HybridAppBridge.js.map