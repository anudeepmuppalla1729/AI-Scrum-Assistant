export class AsyncQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(promiseFactory) {
    return new Promise((resolve, reject) => {
      this.queue.push({ promiseFactory, resolve, reject });
      this.next();
    });
  }

  next() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const { promiseFactory, resolve, reject } = this.queue.shift();
    this.running++;

    promiseFactory()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.next();
      });
  }
}

// Global queue for LLM calls to prevent rate limits
export const llmQueue = new AsyncQueue(3);
