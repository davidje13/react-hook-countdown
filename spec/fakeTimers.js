const {act} = require('react-dom/test-utils');

let currentTime = 0;

jest.useFakeTimers();

function fakeTime() {
  return currentTime;
}

function advanceTime(ms) {
  act(() => {
    currentTime += ms;
    jest.runTimersToTime(ms);
  });
}

beforeEach(() => {
  currentTime = 0;
});

afterEach(() => {
  jest.clearAllTimers();
});

Object.assign(exports, {
  fakeTime,
  advanceTime,
});
