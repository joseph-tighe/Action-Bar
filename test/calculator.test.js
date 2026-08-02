const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadExtension } = require('./helpers/loadExtension');
const { createSearch, createAnswer } = require('./helpers/mocks');

const { context } = loadExtension('calculator');

test('canCalculate returns true for numeric expressions', () => {
  for (const q of ['2+2', '3*4', '10/2', '5^2', 'sqrt(9)', 'pi*2']) {
    assert.equal(context.canCalculate(createSearch(q)), true, `expected "${q}" to be calculable`);
  }
});

test('canCalculate returns false for non-numeric text', () => {
  for (const q of ['hello world', 'what is the weather', 'open chrome', '']) {
    assert.equal(context.canCalculate(createSearch(q)), false, `expected "${q}" to not be calculable`);
  }
});

test('RunCalculator evaluates simple arithmetic', () => {
  const search = createSearch('2+2');
  const answer = createAnswer();
  context.RunCalculator('a', answer, search);
  assert.equal(answer.text, '4');
});

test('RunCalculator handles order of operations', () => {
  const search = createSearch('2+3*4');
  const answer = createAnswer();
  context.RunCalculator('a', answer, search);
  assert.equal(answer.text, '14');
});

test('RunCalculator replaces ^ with exponent operator', () => {
  const search = createSearch('2^10');
  const answer = createAnswer();
  context.RunCalculator('a', answer, search);
  assert.equal(answer.text, '1024');
});

test('RunCalculator substitutes math constants in expressions', () => {
  for (const q of ['2pi', 'pi*2']) {
    const search = createSearch(q);
    const answer = createAnswer();
    context.RunCalculator('a', answer, search);
    assert.equal(answer.text, String(Math.PI * 2), `expected "${q}" to compute 2*pi`);
  }
});

test('RunCalculator ignores a bare constant keyword', () => {
  const search = createSearch('pi');
  const answer = createAnswer();
  context.RunCalculator('a', answer, search);
  assert.equal(answer.text, '');
});

test('RunCalculator uses Math functions', () => {
  const search = createSearch('sqrt(16)');
  const answer = createAnswer();
  context.RunCalculator('a', answer, search);
  assert.equal(answer.text, '4');
});

test('RunCalculator sets search text on Enter when equation ends with =', () => {
  const search = createSearch('6*7=');
  const answer = createAnswer();
  context.RunCalculator('Enter', answer, search);
  assert.equal(answer.text, '42');
  assert.equal(search.getQuery(), '42');
});

test('RunCalculator sets search text on Tab when equation ends with =', () => {
  const search = createSearch('10+5=');
  const answer = createAnswer();
  context.RunCalculator('Tab', answer, search);
  assert.equal(answer.text, '15');
  assert.equal(search.getQuery(), '15');
});

test('RunCalculator without = does not overwrite the search text', () => {
  const search = createSearch('6*7');
  const answer = createAnswer();
  context.RunCalculator('Enter', answer, search);
  assert.equal(answer.text, '42');
  assert.equal(search.getQuery(), '6*7');
});
