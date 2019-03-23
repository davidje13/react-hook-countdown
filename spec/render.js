const ReactDOM = require('react-dom');
const {act} = require('react-dom/test-utils');

let root = null;

beforeEach(() => {
  root = document.createElement('div');
  document.body.appendChild(root);
});

afterEach(() => {
  document.body.removeChild(root);
});

function render(component) {
  act(() => {
    ReactDOM.render(component, root);
  });
}

function querySelector(selector) {
  return root.querySelector(selector);
}

Object.assign(exports, {
  render,
  querySelector,
});
