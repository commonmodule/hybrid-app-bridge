class HybridAppBridge {
  public sendToApp(method: string, data?: any) {
    if ((window as any).messageHandler) {
      (window as any).messageHandler.postMessage(
        JSON.stringify({ method, data }),
      );
    }
  }
}

export default new HybridAppBridge();
