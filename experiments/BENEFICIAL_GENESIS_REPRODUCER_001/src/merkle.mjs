/**
 * Synthetic transaction identity, headers, Merkle proofs.
 */

import { DOMAIN_HEADER, DOMAIN_MERKLE, DOMAIN_TXID } from "./constants.mjs";
import {
  canonicalJsonBytes,
  domainHash,
  domainHashHex,
  requireHex,
} from "./encoding.mjs";

export function txidFromTx(tx) {
  const identity = {
    inputs: tx.inputs,
    locktime: tx.locktime ?? 0,
    outputs: tx.outputs,
    version: tx.version ?? 1,
  };
  return domainHashHex(DOMAIN_TXID, canonicalJsonBytes(identity));
}

export function merkleParent(left, right) {
  return domainHash(DOMAIN_MERKLE, left, right);
}

export function headerHash(header) {
  const body = {
    bits: header.bits ?? 0,
    height: header.height,
    merkle_root_hex: header.merkle_root_hex,
    prev_hash_hex: header.prev_hash_hex,
    time: header.time ?? 0,
  };
  return domainHashHex(DOMAIN_HEADER, canonicalJsonBytes(body));
}

export function confirmations(inclusionHeight, tipHeight) {
  if (tipHeight < inclusionHeight) return 0;
  return tipHeight - inclusionHeight + 1;
}

export function verifyMerkleProof(txidHex, merkleRootHex, branchHex, index) {
  try {
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0) return false;
    if (!Array.isArray(branchHex) || branchHex.length > 64) return false;
    if (index >= 2 ** branchHex.length) return false;
    let h = requireHex("txid", txidHex, { expectedBytes: 32 });
    const root = requireHex("merkle_root", merkleRootHex, { expectedBytes: 32 });
    let idx = index;
    for (const sibHex of branchHex) {
      const sib = requireHex("branch", sibHex, { expectedBytes: 32 });
      if (idx % 2 === 0) h = merkleParent(h, sib);
      else h = merkleParent(sib, h);
      idx = Math.floor(idx / 2);
    }
    return h.equals(root);
  } catch {
    return false;
  }
}

export function merkleRoot(txidsHex) {
  if (!txidsHex || txidsHex.length === 0) throw new Error("empty merkle tree");
  let level = txidsHex.map((t) => requireHex("txid", t, { expectedBytes: 32 }));
  while (level.length > 1) {
    if (level.length % 2 === 1) level.push(level[level.length - 1]);
    const nxt = [];
    for (let i = 0; i < level.length; i += 2) {
      nxt.push(merkleParent(level[i], level[i + 1]));
    }
    level = nxt;
  }
  return level[0].toString("hex");
}
