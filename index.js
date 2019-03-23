const { useEffect, useState } = require('react');

function useRerender() {
  const state = useState(0);
  return () => state[1]((frame) => (frame + 1));
}

function throttle(delay) {
  if (global.document && global.document.hidden) {
    // Page is not visible, so throttle the callback to save user's CPU
    return Math.max(delay, 500);
  }
  return delay;
}

function setSmallTimeout(fn, delay) {
  const result = {};

  if (delay < 10 && global.requestAnimationFrame) {
    result.frame = global.requestAnimationFrame(fn);
  } else {
    result.timer = setTimeout(fn, delay);
    if (global.window) {
      // Timers can be inaccurate when in the background
      // So check state of the world when we regain focus
      result.focus = fn;
      global.window.addEventListener('focus', result.focus);
    }
  }

  return result;
}

function clearSmallTimeout(timeout) {
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

function quantise(remaining, interval) {
  return (Math.ceil(remaining / interval) - 1) * interval;
}

function useCountdown(targetTime, interval = 50, getTime = Date.now) {
  const now = getTime();
  const rerender = useRerender();

  useEffect(() => {
    if (now >= targetTime) {
      return undefined;
    }
    let delay = (targetTime - now) % interval;
    if (delay === 0) {
      delay = interval;
    }
    const timeout = setSmallTimeout(rerender, throttle(delay));
    return () => clearSmallTimeout(timeout);
  });

  return Math.max(quantise(targetTime - now, interval), -1);
}

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = useCountdown;

module.exports = Object.assign(exports.default, exports);
exports.default.default = module.exports;
