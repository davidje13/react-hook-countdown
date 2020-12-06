const {act} = require('react-dom/test-utils');

beforeEach(() => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
  jest.spyOn(window, 'setTimeout');
});

module.exports = {
  advanceTime(ms) {
    act(() => jest.advanceTimersByTime(ms));
  },

  focusWindow() {
    act(() => {
      window.dispatchEvent(new FocusEvent('focus'));
    });
  },

  customGetNow() {
    let timeSlippage = 0;
    const fn = () => (Date.now() + timeSlippage);
    fn.slip = (time) => {
      timeSlippage += time;
    };
    return fn;
  },

  countSetTimeoutCalls() {
    // Excludes internal calls from react-test-renderer
    // See https://stackoverflow.com/a/65162446/1180785
    return setTimeout.mock.calls.filter(([fn, t]) => (
      t !== 0 ||
      !String(fn).includes('_flushCallback')
    ));
  },
};
