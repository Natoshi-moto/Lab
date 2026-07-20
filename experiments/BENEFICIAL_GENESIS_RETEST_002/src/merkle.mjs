import { DOMAINS, MAX_MERKLE_BRANCH, REJECTION } from "./constants.mjs";
import { domainHash, isLowerHex, parseHexStrict, requireU32 } from "./encoding.mjs";

export function merkleParent(left32, right32) {
  return domainHash(DOMAINS.merkle, [left32, right32]);
}

export function merkleRootFromTxids(txidsHex) {
  if (!Array.isArray(txidsHex) || txidsHex.length === 0) {
    throw new Error("empty txids");
  }
  let level = txidsHex.map((h) => parseHexStrict(h, 32));
  while (level.length > 1) {
    if (level.length % 2 === 1) level = [...level, level[level.length - 1]];
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(merkleParent(level[i], level[i + 1]));
    }
    level = next;
  }
  return level[0].toString("hex");
}

export function verifyMerkleInclusion(txidHex, branchHex, index, expectedRootHex) {
  if (!isLowerHex(txidHex, 32) || !isLowerHex(expectedRootHex, 32)) {
    return { ok: false, code: REJECTION.INCLUSION_PROOF_INVALID };
  }
  if (!Array.isArray(branchHex)) {
    return { ok: false, code: REJECTION.INCLUSION_PROOF_INVALID };
  }
  if (branchHex.length > MAX_MERKLE_BRANCH) {
    return { ok: false, code: REJECTION.INCLUSION_PROOF_INVALID };
  }
  const idxCheck = requireU32(index);
  if (!idxCheck.ok) return { ok: false, code: REJECTION.INCLUSION_PROOF_INVALID };

  let hash = parseHexStrict(txidHex, 32);
  let idx = index;
  for (const sibHex of branchHex) {
    if (!isLowerHex(sibHex, 32)) {
      return { ok: false, code: REJECTION.INCLUSION_PROOF_INVALID };
    }
    const sib = parseHexStrict(sibHex, 32);
    if (idx % 2 === 0) {
      hash = merkleParent(hash, sib);
    } else {
      hash = merkleParent(sib, hash);
    }
    idx = Math.floor(idx / 2);
  }
  if (hash.toString("hex") !== expectedRootHex) {
    return { ok: false, code: REJECTION.INCLUSION_PROOF_INVALID };
  }
  return { ok: true };
}
