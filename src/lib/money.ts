export function formatCny(n: number): string {
  const hasDecimals = Math.abs(n % 1) > 0.001;
  const s = n.toLocaleString('zh-CN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `¥${s}`;
}