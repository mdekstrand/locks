# Locking primitives for TypeScript

This module provides various locking primitives for TypeScript.

It is heavily inspired by [asyncutil][], particularly in its API, with my own
take on the ideas and some additional safety capabilities at the likely expense
of some performance.

[asyncutil]: https://github.com/jsr-core/asyncutil