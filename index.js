const { useEffect, useState } = require('react');

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

function useCallbackAtTime(fn, targetTime, getTime) {
  useEffect(() => {
    if (targetTime === null || Number.isNaN(targetTime)) {
      return undefined;
    }
    let timeout = null;
    const checkOnFocus = () => {
      clearSmallTimeout(timeout);
      const now = getTime();
      if (now >= targetTime) {
        timeout = null;
        fn(now);
      } else {
        timeout = setSmallTimeout(
          () => fn(getTime()),
          checkOnFocus,
          throttle(targetTime - now)
        );
      }
    };
    checkOnFocus();
    return () => clearSmallTimeout(timeout);
  }, [fn, targetTime, getTime]);
}

function quantise(remaining, interval) {
  if (remaining <= interval) {
    return 0;
  }
  return (Math.ceil(remaining / interval) - 1) * interval;
}

function getNextUpdateTime(now, targetTime, interval) {
  if (now >= targetTime) {
    return null;
  }
  let delay = (targetTime - now) % interval;
  if (delay === 0) {
    delay = interval;
  }
  return now + delay;
}

function useCountdown(targetTime, interval, getTime) {
  if (!interval || interval < 0) {
    throw new Error('invalid interval');
  }
  const getTimeFn = getTime || Date.now;

  /* This is not pure; technically should be:
   *  const timeState = useState(getTimeFn);
   *  const now = timeState[0];
   * but that causes temporary incorrect output when targetTime changes */
  const now = getTimeFn();
  const timeState = useState(now);

  useCallbackAtTime(
    timeState[1],
    getNextUpdateTime(now, targetTime, interval),
    getTimeFn
  );
  if (now >= targetTime) {
    return -1;
  }
  return quantise(targetTime - now, interval);
}

function useIsAfter(targetTime, getTime) {
  return useCountdown(targetTime, Number.POSITIVE_INFINITY, getTime) < 0;
}

function useIsBefore(targetTime, getTime) {
  return !useIsAfter(targetTime, getTime);
}

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = useCountdown;
exports.useIsAfter = useIsAfter;
exports.useIsBefore = useIsBefore;

module.exports = Object.assign(exports.default, exports);
exports.default.default = module.exports;
