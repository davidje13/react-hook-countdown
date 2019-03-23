const React = require('react');
const useCountdown = require('../index');
const {fakeTime, advanceTime} = require('./fakeTimers');
const {render, querySelector} = require('./render');

global.requestAnimationFrame = null;

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
  const props = {target, interval, getTime: fakeTime};
  render(React.createElement(Component, props));
}

function getDisplayedText() {
  return querySelector('div').textContent;
}

describe('useCountdown', () => {
  it('invokes periodic re-renders', () => {
    renderCountdown(305, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');

    advanceTime(10);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 200');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 3, Remaining: 100');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 4, Remaining: 0');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 5, Remaining: -1');
  });

  it('updates exactly at interval boundry', () => {
    renderCountdown(374, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');

    advanceTime(73);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 300');

    advanceTime(1);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 200');
  });

  it('stops updating once countdown expires', () => {
    renderCountdown(-1000, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');

    advanceTime(150);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');
  });

  it('updates immediately if target changes', () => {
    renderCountdown(1005, 100);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 1000');

    renderCountdown(105, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 100');
  });

  it('updates immediately if interval changes', () => {
    renderCountdown(805, 500);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: 500');

    renderCountdown(805, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 800');
  });

  it('restarts countdown if target changes', () => {
    renderCountdown(-1000, 100);

    advanceTime(250);
    expect(getDisplayedText()).toEqual('Renders: 1, Remaining: -1');

    renderCountdown(505, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: 200');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 3, Remaining: 100');
  });

  it('stops countdown if new target is already reached', () => {
    renderCountdown(1000, 100);
    renderCountdown(-1000, 100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: -1');

    advanceTime(100);
    expect(getDisplayedText()).toEqual('Renders: 2, Remaining: -1');
  });
});
