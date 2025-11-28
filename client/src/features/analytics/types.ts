export type DrivingForceType = 'Megatrend' | 'Trend' | 'Weak Signal' | 'Wildcard';

export const TYPE_ORDER: DrivingForceType[] = ['Megatrend', 'Trend', 'Weak Signal', 'Wildcard'];

export function normalizeType(raw?: string): DrivingForceType | undefined {
  if (!raw) return undefined;
  const s = raw.trim().toLowerCase();
  if (s.startsWith('mega')) return 'Megatrend';
  if (s.startsWith('trend')) return 'Trend';
  if (s.startsWith('weak')) return 'Weak Signal';
  if (s.startsWith('wild')) return 'Wildcard';
  return undefined;
}
