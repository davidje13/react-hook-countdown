const React = require('react');
const {act} = require('react-dom/test-utils');
const useCountdown = require('../index');
const {render, querySelector} = require('./render');

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

function renderCountdown(target, interval) {
  render(React.createElement(Component, { target, interval }));
}

function getDisplayedText() {
  return querySelector('div').textContent;
}

function advanceTime(ms) {
  act(() => jest.advanceTimersByTime(ms));
}

describe('useCountdown', () => {
  let startTime = 0;

  beforeEach(() => {
    startTime = Date.now();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  it('invokes periodic re-renders', () => {
    renderCountdown(startTime + 315, 100);
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
    renderCountdown(startTime + 374, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');

    advanceTime(73);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');

    advanceTime(1);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 200');
  });

  it('stops updating once countdown expires', () => {
    renderCountdown(startTime - 1000, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');

    advanceTime(150);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');
  });

  it('uses requestAnimationFrame for very short durations', () => {
    renderCountdown(startTime + 305, 100);
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
    renderCountdown(startTime + 1005, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 1000');

    renderCountdown(startTime + 105, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 100');
  });

  it('updates immediately if interval changes', () => {
    renderCountdown(startTime + 805, 500);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 500');

    renderCountdown(startTime + 805, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 800');
  });

  it('restarts countdown if target changes', () => {
    renderCountdown(startTime - 1000, 100);

    advanceTime(250);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');

    renderCountdown(startTime + 505, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 200');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 3, Remaining: 100');
  });

  it('stops countdown if new target is already reached', () => {
    renderCountdown(startTime + 1000, 100);
    renderCountdown(startTime - 1000, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: -1');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: -1');
  });

  it('does not reset timers if nothing has changed', () => {
    jest.spyOn(window, 'setTimeout');

    renderCountdown(startTime + 20000, 10000);
    expect(window.setTimeout).toHaveBeenCalledTimes(1);

    advanceTime(5000);
    renderCountdown(startTime + 20000, 10000);
    expect(window.setTimeout).toHaveBeenCalledTimes(1);

    renderCountdown(startTime + 20001, 10000);
    expect(window.setTimeout).toHaveBeenCalledTimes(2);
  });
});
