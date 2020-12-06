const { useEffect, useState } = require('react');

const inf = Number.POSITIVE_INFINITY;

function throttle(delay) {
  if (global.document && global.document.hidden) {
    // Page is not visible, so throttle the callback to save user's CPU
    return Math.max(delay, 500);
  }
  return delay;
}

function setSmallTimeout(fn, focusFn, delay) {
  const result = {};

  if (delay < 10 && global.requestAnimationFrame) {
    result.frame = global.requestAnimationFrame(fn);
  } else {
    result.timer = setTimeout(fn, delay);
    if (global.window) {
      // Timers can be inaccurate when in the background
      // So check state of the world when we regain focus
      result.focus = focusFn;
      global.window.addEventListener('focus', result.focus);
    }
  }

  return result;
}

function clearSmallTimeout(timeout) {
  if (!timeout) {
    return;
  }
  if (timeout.focus) {
    global.window.removeEventListener('focus', timeout.focus);
  }
  if (timeout.timer) {
    clearTimeout(timeout.timer);
  }
  if (timeout.frame) {
    global.cancelAnimationFrame(timeout.frame);
  }
}

function useCallbackAtTime(fn, target, getTime) {
  useEffect(() => {
    if (target === null || Number.isNaN(target)) {
      return undefined;
    }
    let timeout = null;
    const checkOnFocus = () => {
      clearSmallTimeout(timeout);
      const now = getTime();
      if (now >= target) {
        timeout = null;
        fn(now);
      } else {
        timeout = setSmallTimeout(
          () => fn(getTime()),
          checkOnFocus,
          throttle(target - now)
        );
      }
    };
    checkOnFocus();
    return () => clearSmallTimeout(timeout);
  }, [fn, target, getTime]);
}

function quantise(v, step) {
  return Math.floor(v / step) * step;
}

function pickStep(now, anchorTime, interval) {
  if (!Number.isFinite(anchorTime)) {
    return { now: -inf, next: null };
  }
  if (interval === inf) {
    if (now < anchorTime) {
      return { now: -inf, next: anchorTime };
    }
    return { now: anchorTime, next: null };
  }
  const quantisedNow = quantise(now - anchorTime, interval) + anchorTime;
  return { now: quantisedNow, next: quantisedNow + interval };
}

function useTimeInterval(interval, anchor, getTime, stopAtAnchor) {
  const anchorTime = (anchor === undefined) ? 0 : anchor;
  const getTimeFn = getTime || Date.now;

  if (!interval || interval < 0 || Number.isNaN(interval)) {
    throw new Error('invalid interval');
  }
  if (Number.isNaN(anchorTime)) {
    throw new Error('invalid target time');
  }

  /* This is not pure; technically should be:
   *  const timeState = useState(getTimeFn);
   *  const now = timeState[0];
   * but that causes temporary incorrect output when target changes */
  const now = getTimeFn();
  const setTime = useState(now)[1];

  const step = pickStep(now, anchorTime, interval);
  const next = (stopAtAnchor && step.next > anchorTime) ? null : step.next;
  useCallbackAtTime(setTime, next, getTimeFn);
  return step.now;
}

function useCountdown(target, interval, getTime) {
  if (typeof target !== 'number') {
    throw new Error('invalid target time');
  }
  const now = useTimeInterval(interval, target, getTime, true);
  return (
    (now >= target) ? -1 :
      (interval === inf) ? 0 :
        (target - now - interval)
  );
}

function useIsAfter(target, getTime) {
  if (typeof target !== 'number') {
    throw new Error('invalid target time');
  }
  const now = useTimeInterval(inf, target, getTime, true);
  return (now >= target);
}

function useIsBefore(target, getTime) {
  return !useIsAfter(target, getTime);
}

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = useCountdown;
exports.useTimeInterval = useTimeInterval;
exports.useIsAfter = useIsAfter;
exports.useIsBefore = useIsBefore;

module.exports = Object.assign(exports.default, exports);
exports.default.default = module.exports;
