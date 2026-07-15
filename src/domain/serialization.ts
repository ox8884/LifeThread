function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value === null || typeof value !== "object") return value;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    result[key] = normalize(child);
  }
  return result;
}

export function canonicalSerialize(value: unknown): string {
  return JSON.stringify(normalize(value));
}
