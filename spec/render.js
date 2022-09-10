const ReactDOM = require('react-dom/client');
const { act } = require('react-dom/test-utils');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root = null;
let rootDOM = null;

beforeEach(() => {
  root = document.createElement('div');
  rootDOM = ReactDOM.createRoot(root);
  document.body.appendChild(root);
});

function unmount() {
  act(() => rootDOM.unmount());
}

afterEach(() => {
  unmount();
  document.body.removeChild(root);
});

function render(component) {
  act(() => rootDOM.render(component));
}

function querySelector(selector) {
  return root.querySelector(selector);
}

Object.assign(exports, {
  render,
  querySelector,
});
