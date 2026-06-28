// Deterministic seeded PRNG (mulberry32) so mock data is stable across reloads.
export function createRng(seed = 1) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeHelpers(seed = 42) {
  const rng = createRng(seed);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const float = (min, max, decimals = 2) => {
    const v = rng() * (max - min) + min;
    return Number(v.toFixed(decimals));
  };
  const bool = (p = 0.5) => rng() < p;
  const sample = (arr, n) => {
    const copy = [...arr];
    const out = [];
    while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
    return out;
  };
  return { rng, pick, int, float, bool, sample };
}
