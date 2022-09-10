const { act } = require('react-dom/test-utils');

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
    const fn = () => Date.now() + timeSlippage;
    fn.slip = (time) => {
      timeSlippage += time;
    };
    return fn;
  },
};
