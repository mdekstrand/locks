import { Semaphore } from "./semaphore.ts";

/**
 * A mutex (mutual exclusion) lock, allowing a single task to hold the lock at a
 * time.
 *
 * It is identical to a {@link Semaphore} with 1 slote.
 */
export class Mutex extends Semaphore {
    constructor() {
        super(1);
    }
}
