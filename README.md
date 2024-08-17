# Locking primitives for TypeScript

This module provides various locking primitives for modern TypeScript:

```typescript
import {Semaphore} from "@mdekstrand/locks";
const lock = new Semaphore(2);

function myContentiousTask() {
    using _lock = await lock.acquire();
    // do the work
    // the lock is automatically released at end of function!
}
```

It is heavily inspired by [asyncutil][], particularly in its API, with my own
take on the ideas and a focus on simplicity and safety over extremes in
performance (but it does try to avoid unnecessarily inefficient constructs).

It has a single dependency — [deque][], a TypeScript port of [denque][], used to
implement `Notify` (which in turn is used to implement many other elements).

[asyncutil]: https://github.com/jsr-core/asyncutil
[deque]: https://jsr.io/@korkje/deque
[denque]: https://github.com/invertase/denque