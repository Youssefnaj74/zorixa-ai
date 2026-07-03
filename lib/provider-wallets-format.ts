export function roundUsd2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function fmtUsd2(n: number): string {
  return `$${roundUsd2(n).toFixed(2)}`;
}
