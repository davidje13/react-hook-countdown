const { useEffect, useState, useCallback } = require('react');

function useRerender() {
  const setState = useState(0)[1];
  return useCallback(() => setState((frame) => (frame + 1)), []);
}

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

function useRerenderAtTime(targetTime, getTime = Date.now) {
  const rerender = useRerender();
  useEffect(() => {
    if (targetTime === null) {
      return undefined;
    }
    let timeout = null;
    const checkOnFocus = () => {
      clearSmallTimeout(timeout);
      const now = getTime();
      if (now >= targetTime) {
        timeout = null;
        rerender();
      } else {
        timeout = setSmallTimeout(
          rerender,
          checkOnFocus,
          throttle(targetTime - now)
        );
      }
    };
    checkOnFocus();
    return () => clearSmallTimeout(timeout);
  }, [rerender, targetTime, getTime]);
}

function quantise(remaining, interval) {
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

function useCountdown(targetTime, interval = 50, getTime = Date.now) {
  const now = getTime();
  useRerenderAtTime(getNextUpdateTime(now, targetTime, interval), getTime);
  return Math.max(quantise(targetTime - now, interval), -1);
}

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = useCountdown;

module.exports = Object.assign(exports.default, exports);
exports.default.default = module.exports;
