/**
 * Handle representing an acquired lock.
 */
export interface LockHandle extends Disposable {
    /**
     * The lock's key.
     */
    readonly key: symbol;

    /** 
     * Manually release the lock.
     */
    release(): void;
}

export function createLockHandle(release: (key: symbol) => void): LockHandle {
    let key = Symbol();
    return {
        key,

        [Symbol.dispose]() {
            release(key)
        },

        release() {
            release(key)
        }
    }
}

