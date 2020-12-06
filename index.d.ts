export function useTimeInterval(
  interval: number,
  anchorTime?: number,
  getTime?: () => number,
): number;

export function useIsAfter(
  target: number,
  getTime?: () => number,
): boolean;

export function useIsBefore(
  target: number,
  getTime?: () => number,
): boolean;

export default function useCountdown(
  target: number,
  interval: number,
  getTime?: () => number,
): number;
