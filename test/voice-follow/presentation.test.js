const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');
const { rows } = require('./fixtures/canonical-verified.json');

// Exercise the real JSX without Electron, a microphone, ONNX, or a database.
const file = path.resolve(
  __dirname,
  '../../www/main/addons/voice-follow/components/renderVoiceFollowView.jsx',
);
const compiled = babel.transformSync(fs.readFileSync(file, 'utf8'), {
  filename: file,
  configFile: false,
  babelrc: false,
  presets: [require.resolve('@babel/preset-env'), require.resolve('@babel/preset-react')],
}).code;
const loaded = new Module(file, module);
loaded.filename = file;
loaded.paths = module.paths;
loaded._compile(compiled, file);
const render = loaded.exports.default;

function fixture(overrides = {}) {
  const calls = [];
  const action =
    (name) =>
    (...args) =>
      calls.push([name, ...args]);
  return {
    calls,
    props: {
      widgetPos: null,
      pos: null,
      active: false,
      status: 'idle',
      detail: '',
      start: action('manual'),
      stop: action('stop'),
      autopilot: true,
      startAutopilot: action('automatic'),
      autoDetect: false,
      startDetect: action('detect'),
      currentView: null,
      nextView: null,
      isMiscSlide: false,
      rankedView: [],
      cands: [],
      audioView: { level: 0.25, device: 'Microphone' },
      panelVisible: true,
      panelRef: { current: null },
      startDrag: action('drag'),
      setCollapsed: action('collapse'),
      onScreenClose: action('close'),
      MODES: { kirtan: { label: 'Kirtan' } },
      setMode: action('mode'),
      mode: 'kirtan',
      setAutoDetect: action('detect-mode'),
      dlProgress: null,
      SWITCH_CONFIRM: 3,
      detecting: false,
      present: true,
      collapsed: false,
      movedRef: { current: false },
      isOpen: true,
      setOverlayScreen: action('overlay'),
      ...overrides,
    },
  };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
const byClass = (tree, name) =>
  nodes(tree).find((el) => (el.props.className || '').split(' ').includes(name));
const text = (tree) => {
  if (Array.isArray(tree)) return tree.map(text).join('');
  if (tree == null || typeof tree === 'boolean') return '';
  return typeof tree === 'object' ? text(tree.props.children) : String(tree);
};

test('idle Start remains centered and invokes automatic listening', () => {
  const { props, calls } = fixture();
  const tree = render(props);
  assert(byClass(tree, 'vf-compact-footer').props.className.includes('is-idle'));
  const button = byClass(tree, 'vf-main');
  assert.match(text(button), /Start listening/);
  button.props.onClick();
  assert.deepEqual(calls, [['automatic']]);
});

test('Stop and close retain their distinct active-session behavior', () => {
  const { props, calls } = fixture({ active: true, status: 'listening' });
  const tree = render(props);
  assert(!byClass(tree, 'vf-compact-footer').props.className.includes('is-idle'));
  byClass(tree, 'vf-main').props.onClick();
  nodes(tree)
    .find((el) => el.props['aria-label'] === 'Close')
    .props.onClick();
  assert.deepEqual(calls, [['stop'], ['collapse', true]]);
});

test('current Bani stays distinct from an unconfirmed candidate', () => {
  const { props } = fixture({
    active: true,
    status: 'listening',
    currentView: { id: rows[0].shabadId, line: rows[0].text },
    nextView: { shabadId: rows[2].shabadId, cand: rows[2].text, wins: 2 },
  });
  const tree = render(props);
  assert(text(byClass(tree, 'vf-current-shabad')).includes(rows[0].text));
  const candidate = byClass(tree, 'vf-change-preview');
  assert(text(candidate).includes(rows[2].text));
  assert.match(text(candidate), /Confirming a change/);
  const meter = byClass(tree, 'vf-change-track');
  assert.equal(meter.props['aria-valuenow'], 2);
  assert.equal(meter.props['aria-valuemax'], 3);
  assert.equal(meter.props.children.props.style.width, `${(2 / 3) * 100}%`);
  assert.equal(byClass(tree, 'vf-other-matches').props.open, undefined);
});

test('microphone meter reflects the supplied capture level', () => {
  const { props } = fixture({ active: true, status: 'listening' });
  const meter = byClass(render(props), 'vf-mic-bars');
  assert.equal(meter.props['aria-valuenow'], 25);
  assert.equal(meter.props.children.length, 5);
});

test('dragging a collapsed pill does not expand it; clicking afterwards does', () => {
  const { props, calls } = fixture({ panelVisible: false, collapsed: true, isOpen: false });
  const pill = byClass(render(props), 'vf-pill');
  props.movedRef.current = true;
  pill.props.onClick();
  assert.deepEqual(calls, []);
  assert.equal(props.movedRef.current, false);
  pill.props.onClick();
  assert.deepEqual(calls, [
    ['collapse', false],
    ['overlay', 'voice-follow'],
  ]);
});
