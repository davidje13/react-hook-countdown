# React useCountdown hook

Provides a hook for React which updates at a regular interval until a
target time is reached.

## Install dependency

```bash
npm install --save git+https://github.com/davidje13/react-hook-countdown.git#semver:^1.0.0
```

## Usage

```javascript
const useCountdown = require('react-hook-countdown');

const MyComponent = ({targetTime}) => {
  const remaining = useCountdown(targetTime, 1000);

  if (remaining >= 0) {
    return (<div>Seconds remaining: {remaining / 1000}</div>);
  }
  return (<div>Countdown ended!</div>);
};
```

## API

```javascript
const remaining = useCountdown(targetTime, interval, getTimeFunction);
```

All times are in milliseconds. All parameters can be changed
dynamically.

### Parameters

- `targetTime`: the timestamp to count down to (milliseconds since the
  unix epoch).
- `interval`: number of milliseconds between refreshes; this will
  control how often the component is re-rendered, and will be used to
  quantise the returned remaining milliseconds. Defaults to 50
  milliseconds.
- `getTimeFunction`: a function which takes no arguments and returns
  the current time in milliseconds since the unix epoch. Defaults to
  `Date.now`.

  **Note**: `getTimeFunction` should always be a real clock (as it will
  be used to pick an interval for refreshing), i.e. don't provide a
  stationary time, as this may result in a hot-loop of refreshes.
  The primary reason for changing this is to allow a 'server time
  offset' or similar, not to allow a faster or slower flow of time.

### Return value

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

## Page visibility

The countdown will automatically be throttled to a maximum of 2 updates
per second when the page is not visible. It will also always be updated
when the window gains focus (as the timers may slip while the window is
not visible in many browsers).
