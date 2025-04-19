import { v4 as uuidv4 } from "uuid";

class HybridAppBridge {
  private pending: Record<
    string,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  > = {};

  private streams: Record<
    string,
    {
      push: (chunk: any) => void;
      complete: () => void;
      error: (err: any) => void;
    }
  > = {};

  constructor() {
    (window as any).__nativeCallback = (
      id: string,
      ok: boolean,
      payload: any,
    ) => {
      const p = this.pending[id];
      if (!p) return;
      delete this.pending[id];
      (ok ? p.resolve : p.reject)(payload);
    };

    (window as any).__nativePush = (id: string, chunk: any) => {
      const stream = this.streams[id];
      if (!stream) return;
      stream.push(chunk);
    };

    (window as any).__nativeComplete = (id: string) => {
      const stream = this.streams[id];
      if (!stream) return;
      stream.complete();
      delete this.streams[id];
    };

    (window as any).__nativeError = (id: string, err: string) => {
      const stream = this.streams[id];
      if (!stream) return;
      stream.error(err);
      delete this.streams[id];
    };
  }

  public async invoke<T>(method: string, ...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      this.pending[id] = { resolve, reject };
      (window as any).__Native.invoke(JSON.stringify({ id, method, args }));
    });
  }

  public invokeStream<T>(method: string, ...args: any[]): AsyncIterable<T> {
    const id = uuidv4();

    const queue: T[] = [];
    let done = false;
    let error: any = null;
    const consumers: Array<(result: IteratorResult<T>) => void> = [];

    this.streams[id] = {
      push: (chunk: T) => {
        if (consumers.length > 0) {
          const consumer = consumers.shift()!;
          consumer({ value: chunk, done: false });
        } else {
          queue.push(chunk);
        }
      },
      complete: () => {
        done = true;
        while (consumers.length > 0) {
          const consumer = consumers.shift()!;
          consumer({ value: undefined, done: true });
        }
      },
      error: (err: any) => {
        error = err;
        while (consumers.length > 0) {
          const consumer = consumers.shift()!;
          consumer(Promise.reject(error) as unknown as IteratorResult<T>);
        }
      },
    };

    (window as any).__Native.invokeStream(JSON.stringify({ id, method, args }));

    return {
      [Symbol.asyncIterator](): AsyncIterator<T> {
        return {
          next(): Promise<IteratorResult<T>> {
            if (error) return Promise.reject(error);
            if (queue.length > 0) {
              const value = queue.shift()!;
              return Promise.resolve({ value, done: false });
            }
            if (done) return Promise.resolve({ value: undefined, done: true });
            return new Promise((resolve) => consumers.push(resolve));
          },
          throw(err?: any): Promise<IteratorResult<T>> {
            error = err;
            while (consumers.length > 0) {
              const consumer = consumers.shift()!;
              consumer(Promise.reject(error) as unknown as IteratorResult<T>);
            }
            return Promise.reject(err);
          },
          return(): Promise<IteratorResult<T>> {
            done = true;
            while (consumers.length > 0) {
              const consumer = consumers.shift()!;
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
