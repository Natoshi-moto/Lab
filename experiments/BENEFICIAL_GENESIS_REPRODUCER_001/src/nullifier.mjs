/** In-memory nullifier set. */

export class NullifierSet {
  constructor() {
    this._seen = new Set();
  }

  has(nullifierHex) {
    return this._seen.has(nullifierHex);
  }

  consume(nullifierHex) {
    if (typeof nullifierHex !== "string" || nullifierHex.length !== 64) {
      return "TYPE_ERROR";
    }
    if (this._seen.has(nullifierHex)) return "NULLIFIER_ALREADY_CONSUMED";
    this._seen.add(nullifierHex);
    return null;
  }

  /** Rollback a previously consumed nullifier (for reorg simulations). */
  unconsume(nullifierHex) {
    this._seen.delete(nullifierHex);
  }

  snapshot() {
    return [...this._seen].sort();
  }
}
