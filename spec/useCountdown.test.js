const React = require('react');
const {render, querySelector} = require('./render');
const {
  advanceTime,
  focusWindow,
  customGetNow,
  countSetTimeoutCalls,
} = require('./helpers');
const useCountdown = require('../index');

jest.useFakeTimers('modern');

const Component = ({target, interval, getTime}) => {
  const remaining = useCountdown(target, interval, getTime);

  const renderCount = React.useRef(0);
  renderCount.current += 1;

  return React.createElement(
    'div',
    {},
    'Renders: ' + renderCount.current + ', Remaining: ' + remaining
  );
};

function renderCountdown(target, interval, getTime) {
  render(React.createElement(Component, { target, interval, getTime }));
}

function getDisplayedText() {
  return querySelector('div').textContent;
}

describe('useCountdown', () => {
  it('invokes periodic re-renders', () => {
    renderCountdown(Date.now() + 315, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');

    advanceTime(20);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 200');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 3, Remaining: 100');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 4, Remaining: 0');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 5, Remaining: -1');
  });

  it('updates exactly at interval boundry', () => {
    renderCountdown(Date.now() + 374, 100);

    advanceTime(73);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');
    advanceTime(1);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 200');

    advanceTime(199);
    expect(getDisplayedText()).toEqual('Renders: 3, Remaining: 100');
    advanceTime(1);
    expect(getDisplayedText()).toEqual('Renders: 4, Remaining: 0');

    advanceTime(99);
    expect(getDisplayedText()).toEqual('Renders: 4, Remaining: 0');
    advanceTime(1);
    expect(getDisplayedText()).toEqual('Renders: 5, Remaining: -1');
  });

  it('renders initially exactly at interval boundry', () => {
    renderCountdown(Date.now() + 1, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 0');

    renderCountdown(Date.now(), 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: -1');
  });

  it('stops updating once countdown expires', () => {
    renderCountdown(Date.now() - 1000, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');

    advanceTime(150);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');
  });

  it('uses requestAnimationFrame for very short durations', () => {
    renderCountdown(Date.now() + 305, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');

    // Not updated because mock requestAnimationFrame runs every 16 milliseconds
    advanceTime(10);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');

    advanceTime(10);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 200');

    // Next tick is scheduled exactly
    advanceTime(86);
    expect(getDisplayedText()).toEqual('Renders: 3, Remaining: 100');
  });

  it('updates immediately if target changes', () => {
    const startTime = Date.now();
    renderCountdown(startTime + 1005, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 1000');

    renderCountdown(startTime + 105, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 100');
  });

  it('updates immediately if interval changes', () => {
    const startTime = Date.now();
    renderCountdown(startTime + 805, 500);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 500');

    renderCountdown(startTime + 805, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 800');
  });

  it('restarts countdown if target changes', () => {
    const startTime = Date.now();
    renderCountdown(startTime - 1000, 100);

    advanceTime(250);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');

    renderCountdown(startTime + 505, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 200');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 3, Remaining: 100');
  });

  it('stops countdown if new target is already reached', () => {
    const startTime = Date.now();
    renderCountdown(startTime + 1000, 100);
    renderCountdown(startTime - 1000, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: -1');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: -1');
  });

  it('does not reset timers if nothing has changed', () => {
    const startTime = Date.now();

    renderCountdown(startTime + 20000, 10000);
    expect(countSetTimeoutCalls()).toHaveLength(1);

    advanceTime(5000);
    renderCountdown(startTime + 20000, 10000);
    expect(countSetTimeoutCalls()).toHaveLength(1);

    renderCountdown(startTime + 20001, 10000);
    expect(countSetTimeoutCalls()).toHaveLength(2);
  });

  describe('when the window regains focus', () => {
    it('checks if the time has slipped', () => {
      const getNow = customGetNow();

      renderCountdown(Date.now() + 315, 100, getNow);

      getNow.slip(200);
      expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');

      focusWindow();
      expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 100');
    });

    it('does not rerender if the countdown has not changed', () => {
      const getNow = customGetNow();

      renderCountdown(Date.now() + 350, 100, getNow);
      expect(countSetTimeoutCalls()).toHaveLength(1);

      getNow.slip(25);
      focusWindow();
      expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');
      expect(countSetTimeoutCalls()).toHaveLength(2);

      advanceTime(24);
      expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');

      advanceTime(1);
      expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 200');
    });
  });

  describe('infinite interval', () => {
    it('returns 0 until the target time is reached', () => {
      renderCountdown(Date.now() + 315, Number.POSITIVE_INFINITY);
      expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 0');

      advanceTime(314);
      expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 0');

      advanceTime(1);
      expect(getDisplayedText()).toEqual('Renders: 2, Remaining: -1');
    });
  });

  describe('infinite target time', () => {
    it('returns Infinity for future time and does not update', () => {
      renderCountdown(Number.POSITIVE_INFINITY, 100);
      expect(getDisplayedText()).toEqual('Renders: 1, Remaining: Infinity');

      advanceTime(1000);
      expect(getDisplayedText()).toEqual('Renders: 1, Remaining: Infinity');
      expect(countSetTimeoutCalls()).toHaveLength(0);
    });

    it('returns 0 for future if the interval is also infinite', () => {
      renderCountdown(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
      expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 0');
    });

    it('returns -1 for past time and does not update', () => {
      renderCountdown(Number.NEGATIVE_INFINITY, 100);
      expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');

      advanceTime(1000);
      expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');
      expect(countSetTimeoutCalls()).toHaveLength(0);
    });

    it('returns -1 for past if the interval is also infinite', () => {
      renderCountdown(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
      expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');
    });
  });
});
