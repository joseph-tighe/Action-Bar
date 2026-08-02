const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadExtension } = require('./helpers/loadExtension');
const { createSearch, createAnswer } = require('./helpers/mocks');

const { context } = loadExtension('conversion');

test('canConvert detects " to " queries', () => {
  assert.equal(context.canConvert(createSearch('5 miles to km')), 'converter');
  assert.equal(context.canConvert(createSearch('hello')), false);
  assert.equal(context.canConvert(createSearch('')), false);
});

test('getValueAndUnit splits number and unit', () => {
  assert.deepEqual([...context.getValueAndUnit('5 miles')], ['5', ' miles']);
  assert.deepEqual([...context.getValueAndUnit('100cm')], ['100', 'cm']);
  assert.deepEqual([...context.getValueAndUnit('1.5ft')], ['1.5', 'ft']);
});

test('getUnit extracts the trailing unit', () => {
  assert.equal(context.getUnit(' km'), 'km');
  assert.equal(context.getUnit('  m'), 'm');
});

test('formatUnit canonicalizes common units', () => {
  assert.equal(context.formatUnit('feet'), 'ft');
  assert.equal(context.formatUnit('kilometers'), 'km');
  assert.equal(context.formatUnit('miles'), 'mi');
  assert.equal(context.formatUnit('pounds'), 'lb');
  assert.equal(context.formatUnit('F'), 'F');
});

test('getAllConverstions contains direct conversions', () => {
  const conversions = context.getAllConverstions();
  assert.equal(conversions['mi-km'], 1.60934);
  assert.equal(conversions['ft-m'], 1 / 3.28084);
  assert.equal(conversions['kg-lb'], 1 / 0.453592);
});

test('getConversion finds indirect conversions', () => {
  const conv = context.getConversion('in', 'cm', 0, 10, 1, new Set());
  assert.ok(Math.abs(conv - 2.54) < 0.001, `expected ~2.54, got ${conv}`);
});

test('RunConverter converts miles to km', () => {
  const search = createSearch('5 miles to km');
  const answer = createAnswer();
  context.RunConverter('a', answer, search);
  assert.equal(answer.text, '8.0467km');
});

test('RunConverter converts cm to m', () => {
  const search = createSearch('100 cm to m');
  const answer = createAnswer();
  context.RunConverter('a', answer, search);
  assert.equal(answer.text, '1m');
});

test('RunConverter converts kg to lb', () => {
  const search = createSearch('1 kg to lb');
  const answer = createAnswer();
  context.RunConverter('a', answer, search);
  assert.equal(answer.text, '2.2046244201837775lb');
});

test('RunConverter destroys output for non-conversion queries', () => {
  const search = createSearch('hello');
  const answer = createAnswer();
  context.RunConverter('a', answer, search);
  assert.equal(answer.destroyed, true);
});

test('RunConverter sets search text on Tab', () => {
  const search = createSearch('10 ft to m');
  const answer = createAnswer();
  context.RunConverter('Tab', answer, search);
  assert.equal(answer.text, '3.047999902464003m');
  assert.equal(search.getQuery(), '3.047999902464003m');
});
