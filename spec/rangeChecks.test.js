const React = require('react');
const { render, querySelector } = require('./render');
const { advanceTime } = require('./helpers');
const { useIsAfter, useIsBefore } = require('../index');

jest.useFakeTimers();

const Component = ({ useHook, target, getTime }) => {
  const after = useHook(target, getTime);

  const renderCount = React.useRef(0);
  renderCount.current += 1;

  return React.createElement(
    'div',
    {},
    `Renders: ${renderCount.current}, State: ${after}`
  );
};

function renderIsAfter(target, getTime) {
  render(
    React.createElement(Component, {
      useHook: useIsAfter,
      target,
      getTime,
    })
  );
}

function renderIsBefore(target, getTime) {
  render(
    React.createElement(Component, {
      useHook: useIsBefore,
      target,
      getTime,
    })
  );
}

function getDisplayedText() {
  return querySelector('div').textContent;
}

describe('useIsAfter', () => {
  it('returns true once the time is reached', () => {
    renderIsAfter(Date.now() + 315);
    expect(getDisplayedText()).toEqual('Renders: 1, State: false');

    advanceTime(314);
    expect(getDisplayedText()).toEqual('Renders: 1, State: false');

    advanceTime(1);
    expect(getDisplayedText()).toEqual('Renders: 2, State: true');

    advanceTime(100000);
    expect(getDisplayedText()).toEqual('Renders: 2, State: true');
  });

  it('returns true if the time is already reached', () => {
    renderIsAfter(Date.now());
    expect(getDisplayedText()).toEqual('Renders: 1, State: true');

    advanceTime(100000);
    expect(getDisplayedText()).toEqual('Renders: 1, State: true');
  });

  it('rejects invalid target time', () => {
    jest.spyOn(console, 'error').mockImplementation(() => null);
    expect(() => renderIsAfter(undefined)).toThrow('invalid target time');

    expect(() => renderIsAfter(Number.NaN)).toThrow('invalid target time');
  });
});

describe('useIsBefore', () => {
  it('returns true until the time is reached', () => {
    renderIsBefore(Date.now() + 315);
    expect(getDisplayedText()).toEqual('Renders: 1, State: true');

    advanceTime(314);
    expect(getDisplayedText()).toEqual('Renders: 1, State: true');

    advanceTime(1);
    expect(getDisplayedText()).toEqual('Renders: 2, State: false');

    advanceTime(100000);
    expect(getDisplayedText()).toEqual('Renders: 2, State: false');
  });

  it('returns false if the time is already reached', () => {
    renderIsBefore(Date.now());
    expect(getDisplayedText()).toEqual('Renders: 1, State: false');

    advanceTime(100000);
    expect(getDisplayedText()).toEqual('Renders: 1, State: false');
  });

  it('rejects invalid target time', () => {
    jest.spyOn(console, 'error').mockImplementation(() => null);
    expect(() => renderIsBefore(undefined)).toThrow('invalid target time');

    expect(() => renderIsBefore(Number.NaN)).toThrow('invalid target time');
  });
});
