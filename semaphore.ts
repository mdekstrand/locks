import { Notify } from "./notify.ts";

/**
 * Semaphore locking primitive.  A semaphore is a lock with a specified number
 * of slots *n*, and allows up to *n* clients to hold active locks at a time. If
 * *n* locks are already held, additional lockers will block until semaphore
 * slots are available.
 *
 * The semaphore is built for use with the explicit resource management (`using`
 * keyword) proposed for ECMAscript and supported by TypeScript 5.2 and later:
 *
 * ```typescript
 * using _lock = await semaphore.acquire();
 * // do some things
 * // the semaphore is released when `_lock` goes out of scope
 * ```
 *
 * For use with legacy code, the lock handles returned by {@link acquire} also
 * provide an explicit {@link LockHandle.release} method for use in a
 * `try`-`finally` block.
 *
 * This semaphore implementation provides
 */
export class Semaphore {
  #slots: number;
  #active: Map<symbol, WeakRef<LockHandle>> = new Map();
  #wait: Notify = new Notify();

  /**
   * Construct a semaphore with the specified number of slots.
   *
   * @param count The number of active locks the semaphore allows.
   */
  constructor(count: number = 1) {
    this.#slots = count;
  }

  /**
   * Acquire the semaphore.
   *
   * @returns A handle to the semaphore lock for subsequent release.
   */
  async acquire(): Promise<Disposable> {
    while (!this.#available()) {
      // we use a timeout to deal with stale locks and missed notifications
      await this.#wait.notified(50);
    }
    const release = this.#release.bind(this);
    const lock = new LockHandle(release);
    this.#active.set(lock.key, new WeakRef(lock));
    return lock;
  }

  /**
   * Acquire the semaphore for the duration of an asynchronous function.
   *
   * This acquires the semaphore, calls a function, and releases the semaphore
   * when the function's return value is resolved.
   *
   * @param func The function to call.
   * @returns A promise that resolves to the function's result.
   */
  async lock<T>(func: () => Promise<T>): Promise<T> {
    using _lock = await this.acquire();
    return await func();
  }

  #available(): boolean {
    // do we have available slots?
    if (this.#active.size < this.#slots) {
      return true;
    }

    // if we clean up bad slots, do we have available slots?
    const stale: symbol[] = [];
    for (const [k, lr] of this.#active.entries()) {
      if (lr.deref() == undefined) {
        stale.push(k);
      }
    }
    for (const k of stale) {
      this.#active.delete(k);
    }

    return this.#active.size < this.#slots;
  }

  #release(sym: symbol): void {
    if (!this.#active.delete(sym)) {
      throw new Error("semaphore lock already released");
    }

    this.#wait.notify();
  }

  /**
   * Check for stale locks and clean them up.
   */
  _checkStale(): void {
    const stale: symbol[] = [];
    for (const [k, lr] of this.#active.entries()) {
      if (lr.deref() == undefined) {
        stale.push(k);
      }
    }
    for (const k of stale) {
      this.#active.delete(k);
    }

    if (this.#active.size < this.#slots) {
      // wake everybody up to fill slots, or take over from missed lock slots
      this.#wait.notifyAll();
    }
  }
}

/**
 * Handle representing an acquired lock.
 */
export class LockHandle implements Disposable {
  /**
   * The lock's key.
   */
  key: symbol = Symbol();
  /**
   * The release method.
   */
  #release: (key: symbol) => void;

  constructor(release: (key: symbol) => void) {
    this.#release = release;
  }

  [Symbol.dispose]() {
    this.release();
  }

  release() {
    this.#release(this.key);
  }
}
