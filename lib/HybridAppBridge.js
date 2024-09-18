class HybridAppBridge {
    sendToApp(method, data) {
        if (window.messageHandler) {
            window.messageHandler.postMessage(JSON.stringify({ method, data }));
        }
    }
}
export default new HybridAppBridge();
//# sourceMappingURL=HybridAppBridge.js.map