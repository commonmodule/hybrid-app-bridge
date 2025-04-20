import { v4 as uuidv4 } from "uuid";
class HybridAppBridge {
    pending = {};
    streams = {};
    constructor() {
        window.__nativeCallback = (id, ok, payload) => {
            const p = this.pending[id];
            if (!p)
                return;
            delete this.pending[id];
            (ok ? p.resolve : p.reject)(payload);
        };
        window.__nativePush = (id, chunk) => {
            const stream = this.streams[id];
            if (!stream)
                return;
            stream.push(chunk);
        };
        window.__nativeComplete = (id) => {
            const stream = this.streams[id];
            if (!stream)
                return;
            stream.complete();
            delete this.streams[id];
        };
        window.__nativeError = (id, err) => {
            const stream = this.streams[id];
            if (!stream)
                return;
            stream.error(err);
            delete this.streams[id];
        };
    }
    isHybridApp() {
        return typeof window.__Native?.invoke === "function";
    }
    async invoke(method, ...args) {
        if (!this.isHybridApp()) {
            return Promise.reject(new Error("Not in a Hybrid App Environment."));
        }
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            this.pending[id] = { resolve, reject };
            window.__Native.invoke(JSON.stringify({ id, method, args }));
        });
    }
    invokeStream(method, ...args) {
        if (!this.isHybridApp()) {
            const error = new Error("Not in a Hybrid App Environment.");
            return {
                [Symbol.asyncIterator]() {
                    return {
                        next() {
                            return Promise.reject(error);
                        },
                        throw(err) {
                            return Promise.reject(err);
                        },
                        return() {
                            return Promise.resolve({ value: undefined, done: true });
                        },
                    };
                },
            };
        }
        const id = uuidv4();
        const queue = [];
        let done = false;
        let error = null;
        const consumers = [];
        this.streams[id] = {
            push: (chunk) => {
                if (consumers.length > 0) {
                    const consumer = consumers.shift();
                    consumer({ value: chunk, done: false });
                }
                else {
                    queue.push(chunk);
                }
            },
            complete: () => {
                done = true;
                while (consumers.length > 0) {
                    const consumer = consumers.shift();
                    consumer({ value: undefined, done: true });
                }
            },
            error: (err) => {
                error = err;
                while (consumers.length > 0) {
                    const consumer = consumers.shift();
                    consumer(Promise.reject(error));
                }
            },
        };
        window.__Native.invokeStream(JSON.stringify({ id, method, args }));
        return {
            [Symbol.asyncIterator]() {
                return {
                    next() {
                        if (error)
                            return Promise.reject(error);
                        if (queue.length > 0) {
                            const value = queue.shift();
                            return Promise.resolve({ value, done: false });
                        }
                        if (done)
                            return Promise.resolve({ value: undefined, done: true });
                        return new Promise((resolve) => consumers.push(resolve));
                    },
                    throw(err) {
                        error = err;
                        while (consumers.length > 0) {
                            const consumer = consumers.shift();
                            consumer(Promise.reject(error));
                        }
                        return Promise.reject(err);
                    },
                    return() {
                        done = true;
                        while (consumers.length > 0) {
                            const consumer = consumers.shift();
                            consumer({ value: undefined, done: true });
                        }
                        return Promise.resolve({ value: undefined, done: true });
                    },
                };
            },
        };
    }
}
export default new HybridAppBridge();
//# sourceMappingURL=HybridAppBridge.js.map