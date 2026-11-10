const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const script = readFileSync(join(__dirname, "../static/navigation.js"), "utf8");

function setup() {
  const events = {};
  const inside = {};
  let focused = false;
  const picker = {
    open: true,
    contains: (target) => target === inside,
    querySelector: () => ({ focus: () => { focused = true; } }),
    addEventListener: (name, callback) => { events[name] = [callback]; },
  };
  const document = {
    querySelector: () => picker,
    addEventListener: (name, callback) => { (events[name] ||= []).push(callback); },
  };
  runInNewContext(script, { document });
  return { picker, inside, events, focused: () => focused };
}

test("Escape chiude la tendina e riporta il focus al selettore", () => {
  const state = setup();
  let prevented = false;
  state.events.keydown[0]({ key: "Escape", preventDefault: () => { prevented = true; } });
  assert(!state.picker.open && state.focused() && prevented);
  state.events.keydown[0]({ key: "Escape", preventDefault: () => assert.fail("Menu già chiuso") });
});

test("Click esterno e uscita del focus chiudono senza interferire con i link", () => {
  const state = setup();
  const click = state.events.click[0];
  click({ target: state.inside });
  assert(state.picker.open);
  state.events.focusout[0]({ relatedTarget: state.inside });
  assert(state.picker.open);
  click({ target: {} });
  assert(!state.picker.open && !state.focused());
  state.picker.open = true;
  state.events.focusout[0]({ relatedTarget: {} });
  assert(!state.picker.open && !state.focused());
});
