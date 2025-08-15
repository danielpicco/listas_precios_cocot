export const safeArr = <T = any>(v: unknown): T[] =>
  Array.isArray(v) ? (v as T[]) : [];