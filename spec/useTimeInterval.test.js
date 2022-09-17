const React = require('react');
const { render, querySelector } = require('./render');
const { advanceTime } = require('./helpers');
const { useTimeInterval } = require('../index');

const Component = ({ interval, anchor }) => {
  const time = useTimeInterval(interval, anchor);

  const renderCount = React.useRef(0);
  renderCount.current += 1;

  return React.createElement(
    'div',
    {},
    `Renders: ${renderCount.current}, Time: ${time}`
  );
};

function renderTimeInterval(interval, anchor) {
  render(React.createElement(Component, { interval, anchor }));
}

function getDisplayedText() {
  return querySelector('div').textContent;
}

describe('useTimeInterval', () => {
  it('invokes periodic re-renders towards the target time', () => {
    advanceTime(1000 - (Date.now() % 1000));

    const begin = Date.now();
    renderTimeInterval(1000, begin + 3000);
    expect(getDisplayedText()).toEqual(`Renders: 1, Time: ${begin}`);

    advanceTime(999);
    expect(getDisplayedText()).toEqual(`Renders: 1, Time: ${begin}`);

    advanceTime(1);
    expect(getDisplayedText()).toEqual(`Renders: 2, Time: ${begin + 1000}`);

    advanceTime(999);
    expect(getDisplayedText()).toEqual(`Renders: 2, Time: ${begin + 1000}`);

    advanceTime(1);
    expect(getDisplayedText()).toEqual(`Renders: 3, Time: ${begin + 2000}`);
  });

  it('invokes periodic re-renders beyond the target time', () => {
    advanceTime(1000 - (Date.now() % 1000));

    const begin = Date.now();
    renderTimeInterval(1000, begin - 1000);
    expect(getDisplayedText()).toEqual(`Renders: 1, Time: ${begin}`);

    advanceTime(999);
    expect(getDisplayedText()).toEqual(`Renders: 1, Time: ${begin}`);

    advanceTime(1);
    expect(getDisplayedText()).toEqual(`Renders: 2, Time: ${begin + 1000}`);

    advanceTime(999);
    expect(getDisplayedText()).toEqual(`Renders: 2, Time: ${begin + 1000}`);

    advanceTime(1);
    expect(getDisplayedText()).toEqual(`Renders: 3, Time: ${begin + 2000}`);
  });

  it('invokes periodic re-renders through the target time', () => {
    advanceTime(1000 - (Date.now() % 1000));

    const begin = Date.now();
    renderTimeInterval(1000, begin + 1000);
    expect(getDisplayedText()).toEqual(`Renders: 1, Time: ${begin}`);

    advanceTime(999);
    expect(getDisplayedText()).toEqual(`Renders: 1, Time: ${begin}`);

    advanceTime(1);
    expect(getDisplayedText()).toEqual(`Renders: 2, Time: ${begin + 1000}`);

    advanceTime(999);
    expect(getDisplayedText()).toEqual(`Renders: 2, Time: ${begin + 1000}`);

    advanceTime(1);
    expect(getDisplayedText()).toEqual(`Renders: 3, Time: ${begin + 2000}`);
  });

  it('updates at intervals from the target time', () => {
    advanceTime(1000 - (Date.now() % 1000));

    const begin = Date.now();
    renderTimeInterval(1000, begin + 3300);
    expect(getDisplayedText()).toEqual(`Renders: 1, Time: ${begin - 700}`);

    advanceTime(299);
    expect(getDisplayedText()).toEqual(`Renders: 1, Time: ${begin - 700}`);

    advanceTime(1);
    expect(getDisplayedText()).toEqual(`Renders: 2, Time: ${begin + 300}`);
  });

  it('defaults to target time = 0', () => {
    advanceTime(1000 - (Date.now() % 1000));

    const begin = Date.now();
    renderTimeInterval(1000);
    expect(getDisplayedText()).toEqual(`Renders: 1, Time: ${begin}`);
  });

  describe('infinite input', () => {
    it('updates only at the target time when interval is infinite', () => {
      advanceTime(1000 - (Date.now() % 1000));

      const begin = Date.now();
      renderTimeInterval(Number.POSITIVE_INFINITY, begin + 2000);
      expect(getDisplayedText()).toEqual('Renders: 1, Time: -Infinity');

      advanceTime(4000);
      expect(getDisplayedText()).toEqual(`Renders: 2, Time: ${begin + 2000}`);
      expect(setTimeout.mock.calls).toHaveLength(1);
    });

    it('does not update past the target time when interval is infinite', () => {
      advanceTime(1000 - (Date.now() % 1000));

      const begin = Date.now();
      renderTimeInterval(Number.POSITIVE_INFINITY, begin - 2000);
      expect(getDisplayedText()).toEqual(`Renders: 1, Time: ${begin - 2000}`);
      expect(setTimeout.mock.calls).toHaveLength(0);
    });

    it('does not update when target time is +infinity', () => {
      renderTimeInterval(100, Number.POSITIVE_INFINITY);
      advanceTime(4000);

      expect(getDisplayedText()).toEqual('Renders: 1, Time: -Infinity');
      expect(setTimeout.mock.calls).toHaveLength(0);
    });

    it('does not update when target time is -infinity', () => {
      renderTimeInterval(100, Number.NEGATIVE_INFINITY);
      advanceTime(4000);

      expect(getDisplayedText()).toEqual('Renders: 1, Time: -Infinity');
      expect(setTimeout.mock.calls).toHaveLength(0);
    });

    it('does not update when target time and interval are infinite', () => {
      renderTimeInterval(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY);
      advanceTime(4000);

      expect(getDisplayedText()).toEqual('Renders: 1, Time: -Infinity');
      expect(setTimeout.mock.calls).toHaveLength(0);
    });
  });
});
