const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadExtension } = require('./helpers/loadExtension');
const { createSearch, createAnswer, createIpcRenderer } = require('./helpers/mocks');

const ipc = createIpcRenderer();
const timers = [];
const fakeSetTimeout = (fn, ms) => { timers.push({ fn, ms }); return timers.length; };
const { context } = loadExtension('timer', { ipcRenderer: ipc, setTimeout: fakeSetTimeout });

test('formatTimeInt pads single digits', () => {
  assert.equal(context.formatTimeInt(5), '05');
  assert.equal(context.formatTimeInt(59), '59');
  assert.equal(context.formatTimeInt(0), '00');
});

test('RunTimer treats a single number as minutes', () => {
  const search = createSearch('90');
  const answer = createAnswer();
  context.RunTimer('a', answer, search);
  assert.equal(answer.text, '1:30:00');
});

test('RunTimer formats two minutes as H:MM:SS', () => {
  const search = createSearch('2');
  const answer = createAnswer();
  context.RunTimer('a', answer, search);
  assert.equal(answer.text, '0:02:00');
});

test('RunTimer handles m:s input', () => {
  const search = createSearch('1:30');
  const answer = createAnswer();
  context.RunTimer('a', answer, search);
  assert.equal(answer.text, '0:01:30');
});

test('RunTimer handles h:m:s input', () => {
  const search = createSearch('1:02:03');
  const answer = createAnswer();
  context.RunTimer('a', answer, search);
  assert.equal(answer.text, '1:02:03');
});

test('RunTimer sends a notification on Enter and schedules the timer', () => {
  const before = timers.length;
  const search = createSearch('5');
  const answer = createAnswer();
  context.RunTimer('Enter', answer, search);
  const channels = ipc.sent.map(([ch]) => ch);
  assert.ok(channels.includes('show-notification'));
  assert.equal(timers.length, before + 1);
  assert.equal(timers[timers.length - 1].ms, 5 * 60 * 1000);
});

test('RunTimer does not schedule a timer on non-Enter keys', () => {
  const before = timers.length;
  const search = createSearch('5');
  const answer = createAnswer();
  context.RunTimer('a', answer, search);
  assert.equal(timers.length, before);
});
