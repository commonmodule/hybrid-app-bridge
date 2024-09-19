type GlobalFunction = (...args: any[]) => void;

class HybridAppBridge {
  public sendToApp(method: string, data?: any) {
    if ((window as any).messageHandler) {
      (window as any).messageHandler.postMessage(
        JSON.stringify({ method, data }),
      );
    }
  }

  public registerGlobalFunction(name: string, func: GlobalFunction): void {
    if (typeof (window as any)[name] !== "undefined") {
      console.warn(
        `A global function named '${name}' already exists. It will be overwritten.`,
      );
    }
    (window as any)[name] = func;
  }

  public removeGlobalFunction(name: string): void {
    if (typeof (window as any)[name] === "function") {
      delete (window as any)[name];
    } else {
      console.warn(`No global function named '${name}' exists.`);
    }
  }
}

export default new HybridAppBridge();
