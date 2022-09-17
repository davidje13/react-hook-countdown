const {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} = require('react');

const INF = Number.POSITIVE_INFINITY;
const VOID_TIMEOUT = () => null;

const SCHEDULER_DEFAULT_OPTIONS = {
  getTime: Date.now,
  visibleThrottle: 10,
  hiddenThrottle: 500,
};

class Scheduler {
  constructor(options) {
    options = Object.assign({}, SCHEDULER_DEFAULT_OPTIONS, options);
    this.getTime = options.getTime;
    this._visibleThrottle = options.visibleThrottle;
    this._hiddenThrottle = options.hiddenThrottle;
    this._tasks = [];
    this._target = null;
    this._clearTimeout = null;
    this._check = this._check.bind(this);
  }

  _check() {
    const now = this.getTime();
    const tasks = this._tasks;
    let i;
    for (i = 0; i < tasks.length && now >= tasks[i].target; ++i);
    for (const task of tasks.splice(0, i)) {
      try {
        task.fn(now);
      } catch (e) {
        console.error('error in scheduled task', e);
      }
    }
    this._update(true);
  }

  _clear(task) {
    const i = this._tasks.indexOf(task);
    if (i !== -1) {
      this._tasks.splice(i, 1);
      if (i === 0) {
        this._update();
      }
    }
  }

  _update(force) {
    if (this._tasks.length > 0) {
      const now = this.getTime();
      const next = this._tasks[0].target;
      const delay = Math.max(
        next - now,
        global.document && global.document.hidden
          ? this._hiddenThrottle
          : this._visibleThrottle
      );
      if (this._clearTimeout === null) {
        if (global.window) {
          // Timers can be inaccurate when in the background
          // So check state of the world when we regain focus
          global.window.addEventListener('focus', this._check);
        }
      } else {
        if (!force && next <= this._target && now + delay >= this._target) {
          return;
        }
        this._clearTimeout();
      }
      if (delay <= 10 && global.requestAnimationFrame) {
        const frame = global.requestAnimationFrame(this._check);
        this._clearTimeout = () => global.cancelAnimationFrame(frame);
      } else {
        const timer = setTimeout(this._check, delay);
        this._clearTimeout = () => clearTimeout(timer);
      }
      this._target = now + delay;
    } else if (this._clearTimeout !== null) {
      if (global.window) {
        global.window.removeEventListener('focus', this._check);
      }
      this._clearTimeout();
      this._clearTimeout = null;
    }
  }

  schedule(fn, target) {
    if (typeof target !== 'number' || Number.isNaN(target)) {
      return VOID_TIMEOUT;
    }
    const task = { fn, target };
    const tasks = this._tasks;
    const len = tasks.length;
    if (!len || target < tasks[0].target) {
      tasks.unshift(task);
      this._update();
    } else if (target >= tasks[len - 1].target) {
      tasks.push(task);
    } else {
      // this could be a binary search for a possible performance boost
      for (let i = 1; i < len; ++i) {
        if (target < tasks[i].target) {
          tasks.splice(i, 0, task);
          break;
        }
      }
    }
    return () => this._clear(task);
  }
}

const ROOT_SCHEDULER = new Scheduler();
const timeContext = createContext(ROOT_SCHEDULER);

const TimeProvider = ({ scheduler, children }) =>
  createElement(
    timeContext.Provider,
    { value: useState(scheduler || ROOT_SCHEDULER)[0] },
    children
  );

const quantise = (v, step) => Math.floor(v / step) * step;

function pickStep(now, anchorTime, interval) {
  if (!Number.isFinite(anchorTime)) {
    return { now: -INF, next: null };
  }
  if (interval === INF) {
    if (now < anchorTime) {
      return { now: -INF, next: anchorTime };
    }
    return { now: anchorTime, next: null };
  }
  const quantisedNow = quantise(now - anchorTime, interval) + anchorTime;
  return { now: quantisedNow, next: quantisedNow + interval };
}

function useTimeInterval(interval, anchor, stopAtAnchor) {
  if (anchor === undefined && !stopAtAnchor) {
    anchor = 0;
  }
  if (typeof interval !== 'number' || Number.isNaN(interval) || interval <= 0) {
    throw new Error('invalid interval');
  }
  if (typeof anchor !== 'number' || Number.isNaN(anchor)) {
    throw new Error('invalid target time');
  }

  const scheduler = useContext(timeContext);
  const [, setNow] = useState(scheduler.getTime);

  /* This is not pure; technically should all be in useEffect,
   * but that causes temporary incorrect output when parameters change */
  const { now, next } = pickStep(scheduler.getTime(), anchor, interval);
  const target = stopAtAnchor && next > anchor ? null : next;
  useEffect(() => scheduler.schedule(setNow, target), [scheduler, target]);
  return now;
}

const useCountdown = (target, interval) => {
  const now = useTimeInterval(interval, target, true);
  return now >= target ? -1 : interval === INF ? 0 : target - now - interval;
};
const useIsAfter = (target) => useTimeInterval(INF, target, true) >= target;
const useIsBefore = (target) => !useIsAfter(target);

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = useCountdown;
exports.useTimeInterval = useTimeInterval;
exports.useCountdown = useCountdown;
exports.useIsAfter = useIsAfter;
exports.useIsBefore = useIsBefore;
exports.Scheduler = Scheduler;
exports.TimeProvider = TimeProvider;

module.exports = Object.assign(exports.default, exports);
exports.default.default = module.exports;
