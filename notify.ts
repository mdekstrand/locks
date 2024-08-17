import { Deque } from "@korkje/deque";

interface NotifyWaiter extends PromiseWithResolvers<boolean> {
  resolution?: "notified" | "cancelled";
  timeout?: number;
}

/**
 * Notify waiters that some condition may have changed.
 *
 * Notify is used to wait for other code to (possibly) make some change and
 * notify the waiter that it has happened.  It is a building block for other
 * primitives, and is also useful to simulate condition variables, implement
 * asynchronous queues, and other cases where code needs tob e able to wait for
 * other code to act.
 *
 * Notify will usually be used in a loop to check if the change in question has
 * actually happened or meets the waiter's requirements.
 */
export class Notify {
  #waiters: Deque<NotifyWaiter> = new Deque();

  /**
   * Wait until notified.
   * @param timeout A timeout (in milliseconds) after which the waiter should
   *                wake up even if not notified.
   * @returns A promise that resolves to `true` if it is woken up by notification,
   *          and `false` if woken up by timeout.
   */
  notified(timeout?: number): Promise<boolean> {
    const wait: NotifyWaiter = Promise.withResolvers<boolean>();
    this.#waiters.push(wait);
    if (timeout) {
      wait.timeout = setTimeout(() => {
        if (!wait.resolution) {
          wait.resolution = "cancelled";
          wait.resolve(false);
        }
      }, timeout);
    }
    return wait.promise;
  }

  /**
   * Wake up a single waiting task.
   */
  notify(): void {
    while (true) {
      const wait = this.#waiters.shift();
      if (!wait) return;

      if (!wait.resolution) {
        wait.resolution = "notified";
        if (wait.timeout != undefined) {
          clearTimeout(wait.timeout);
        }
        queueMicrotask(() => wait.resolve(true));
        return;
      }
    }
  }

  /**
   * Wake up all waiting tasks.
   */
  notifyAll(): void {
    while (true) {
      const wait = this.#waiters.shift();
      if (!wait) return;

      queueMicrotask(() => wait.resolve(true));
    }
  }
}
