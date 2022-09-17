# React useCountdown hook

Provides a hook for React which updates at a regular interval until a
target time is reached.

See the [examples](#examples) for other use cases.

## Install dependency

```bash
npm install --save react-hook-final-countdown
```

## Usage

```jsx
const useCountdown = require('react-hook-final-countdown');

const MyComponent = ({targetTime}) => {
  const remaining = useCountdown(targetTime, 1000);

  if (remaining >= 0) {
    return (<div>Seconds remaining: {remaining / 1000}</div>);
  }
  return (<div>Countdown ended!</div>);
};
```

## API

```js
const remaining = useCountdown(targetTime, interval);

const time = useTimeInterval(interval[, anchorTime]);

const after = useIsAfter(time);

const before = useIsBefore(time);
```

All times are in milliseconds. All parameters can be changed
dynamically.

### `useCountdown(targetTime, interval)`

Counts down to the given target time.

- `targetTime`: the timestamp to count down to (milliseconds since the
  unix epoch).
- `interval`: number of milliseconds between refreshes; this will
  control how often the component is re-rendered, and will be used to
  quantise the returned remaining milliseconds.

The returned value is -1 after the target time has been reached. Until
then, it is the remaining number of milliseconds quantised by the
requested interval (rounded down).

For example, for an interval of 800ms, returned values may be:

- 2400
- 1600
- 800
- 0
- -1

Positive returned values will always be a multiple of the requested
interval (to within numeric precision).

### `useTimeInterval(interval[, anchorTime])`

Provides an infinite timer, updating every `interval` milliseconds.

- `interval`: number of milliseconds between refreshes; this will
  control how often the component is re-rendered, and will be used to
  quantise the returned time.
- `anchorTime`: a time which can be in the future or the past; this
  will control the "phase" of the clock. For example, setting
  `interval` to 1000 and `anchorTime` to 500 will cause an update
  every second on the half-second boundary. Defaults to 0.

Returns the current timestamp, quantised using `interval`.

### `useIsAfter(targetTime)`

A convenience wrapper around `useCountdown`. Equivalent to:

```js
useCountdown(targetTime, POSITIVE_INFINITY) < 0
```

- `targetTime`: the timestamp to wait for (milliseconds since the
  unix epoch).

Returns false until the target time is reached, then true.

### `useIsBefore(targetTime)`

A convenience wrapper around `useCountdown`. Equivalent to:

```js
useCountdown(targetTime, POSITIVE_INFINITY) >= 0
```

- `targetTime`: the timestamp to wait for (milliseconds since the
  unix epoch).

Returns true until the target time is reached, then false.

### `<TimeProvider scheduler={scheduler}>`

An entry point to manipulate the flow of time (e.g. for testing).

```jsx
const myScheduler = {
  getTime: () => Date.now(),
  schedule: (fn, target) => {
    const tm = setTimeout(fn, target - Date.now());
    return () => clearTimeout(fn);
  },
};

const MyApp = () => (
  <TimeProvider scheduler={myScheduler}>
    <MyComponent />
  </TimeProvider>
);
```

By default, a `Scheduler` with default parameters is used. When using
custom scheduling, it is recommended that you configure or wrap a
`Scheduler` rather than creating a new implementation from scratch
(e.g. see the ["half speed" example below](#custom-time-flow-half-speed)).

Note that it is not possible to change the `scheduler` parameter; if
you need to change the scheduler dynamically, do so within the
scheduler itself.

### `new Scheduler(options)`

A class which provides scheduling ability, including aggregation of
multiple scheduled tasks and throttling when the page is not visible.

```jsx
const myScheduler = new Scheduler({
  getTime: Date.now,
  visibleThrottle: 10,
  hiddenThrottle: 500,
});

const MyApp = () => (
  <TimeProvider scheduler={myScheduler}>
    <MyComponent />
  </TimeProvider>
);
```

- `options`: configuration options for the scheduler:
  - `getTime`: a function which returns time since an epoch in
    milliseconds. Defaults to `Date.now`.
  - `visibleThrottle`: a minimum delay to apply when the page is
    visible (i.e. the browser tab is selected). Defaults to 10ms.
  - `hiddenThrottle`: a minimum delay to apply when the page is
    not visible (i.e. another browser tab is selected).
    Defaults to 500ms to reduce load on the client CPU.
    When the page regains focus, all timers will be checked (as
    the timers may slip while the window is not visible in many
    browsers)

If you provide a custom `getTime` implementation, note that the
scheduled tasks will still assume that the time will increment in
real-time (i.e. its value will increase by 1000 every second). If
you want to modify the flow of time, you will need to use a wrapper
around `schedule` (e.g. see the
["half speed" example below](#custom-time-flow-half-speed)).

This class is designed for use with the `TimeProvider`, but can
also be used independently:

```js
const myScheduler = new Scheduler({
  getTime: Date.now,
  visibleThrottle: 10,
  hiddenThrottle: 500,
});

const now = myScheduler.getTime();
const cancel = myScheduler.schedule(myFn, now + 5000);
// in 5 seconds, myFn will be invoked,
// or call cancel() to cancel the task
```

## Examples

### A countdown to the year 3000

```jsx
const {useCountdown} = require('react-hook-final-countdown');

const Y3K = Date.UTC(3000);

const MyComponent = () => {
  const remaining = useCountdown(Y3K, 1000);

  if (remaining >= 0) {
    return (<div>Seconds remaining: {remaining / 1000}</div>);
  }
  return (<div>Happy new year!</div>);
};
```

### A button which is disabled for a short time when first displayed

```jsx
const {useIsAfter} = require('react-hook-final-countdown');

const MyDelayedButton = ({onClick}) => {
  const [firstRenderedTime] = useState(Date.now());
  const enabled = useIsAfter(firstRenderedTime + 1000);

  return (<button disabled={!enabled} onClick={onClick}>Continue</button>);
};
```

### A button which prevents rapid clicking

```jsx
const {useIsAfter} = require('react-hook-final-countdown');

const MyDelayedButton = ({onClick}) => {
  const [lastClicked, setLastClicked] = useState(Number.NEGATIVE_INFINITY);
  const enabled = useIsAfter(lastClicked + 1000);
  const clickHandler = () => {
    setLastClicked(Date.now());
    onClick();
  };

  return (<button disabled={!enabled} onClick={clickHandler}>Continue</button>);
};
```

### A clock

```jsx
const {useTimeInterval} = require('react-hook-final-countdown');

const MyClock = () => {
  const time = useTimeInterval(1000);

  return (<span>{new Date(time).toString()}</span>);
};
```

### Custom time flow (half speed)

```jsx
const {Scheduler, TimeProvider} = require('react-hook-final-countdown');

const scheduler = new Scheduler();
const slowMotionScheduler = {
  getTime: () => scheduler.getTime() * 0.5,
  schedule: (fn, target) => scheduler.schedule(fn, target * 2),
};

const MySlowMotionApp = () => (
  <TimeProvider scheduler={slowMotionScheduler}>
    <MyComponent />
  </TimeProvider>
);
```

### Custom time flow (static snapshot-in-time)

```jsx
const {TimeProvider} = require('react-hook-final-countdown');

const time = Date.UTC(2000);
const frozenScheduler = {
  getTime: () => time, // fixed time
  schedule: (fn, target) => () => null, // no-op
};

const MyFrozenApp = () => (
  <TimeProvider scheduler={frozenScheduler}>
    <MyComponent />
  </TimeProvider>
);
```
