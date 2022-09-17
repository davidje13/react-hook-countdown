import type { FunctionComponent, PropsWithChildren } from 'react';

export function useTimeInterval(interval: number, anchorTime?: number): number;
export function useCountdown(target: number, interval: number): number;
export function useIsAfter(target: number): boolean;
export function useIsBefore(target: number): boolean;
export type Cancel = () => void;
export type ScheduledFunction = (now: number) => void;
export interface IScheduler {
  getTime(): number;
  schedule(fn: ScheduledFunction, target: number | null): Cancel;
}
interface SchedulerOptions {
  getTime?: () => number;
  visibleThrottle?: number;
  hiddenThrottle?: number;
}
export class Scheduler implements IScheduler {
  constructor(options?: SchedulerOptions | null | undefined);

  getTime(): number;
  schedule(fn: ScheduledFunction, target: number | null): Cancel;
}
export const TimeProvider: FunctionComponent<
  PropsWithChildren<{ scheduler?: IScheduler | null | undefined }>
>;

export default useCountdown;
