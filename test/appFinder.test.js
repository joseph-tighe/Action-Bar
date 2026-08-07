const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadAppFinder } = require('./helpers/loadAppFinder');

const ctx = loadAppFinder({ disableFileSearch: true });

test('levenshteinOptimized returns edit distance', () => {
  assert.equal(ctx.levenshteinOptimized('kitten', 'sitting'), 3);
  assert.equal(ctx.levenshteinOptimized('', 'abc'), 3);
  assert.equal(ctx.levenshteinOptimized('abc', ''), 3);
  assert.equal(ctx.levenshteinOptimized('same', 'same'), 0);
});

test('normalize lowercases, trims, and strips diacritics and punctuation', () => {
  assert.equal(ctx.normalize('Café'), 'cafe');
  assert.equal(ctx.normalize('  HELLO!!! '), 'hello');
  assert.equal(ctx.normalize('naïve résumé'), 'naive resume');
});

test('similarity returns 1 for identical strings', () => {
  assert.equal(ctx.similarity('chrome', 'chrome'), 1);
});

test('similarity returns 1 when both strings are empty', () => {
  assert.equal(ctx.similarity('', ''), 1);
});

test('similarity returns a value in [0,1] for partial matches', () => {
  const score = ctx.similarity('kitten', 'sitting');
  assert.ok(score > 0 && score < 1);
  assert.ok(ctx.similarity('calc', 'calculator') > 0);
});

test('findBestMatch finds an exact match', () => {
  const result = ctx.findBestMatch('chrome', ['chrome', 'calculator', 'timer']);
  assert.equal(result.best, 'chrome');
  assert.equal(result.score, 1);
});

test('findBestMatch ranks the closest candidate first', () => {
  const result = ctx.findBestMatch('calc', ['chrome', 'calculator']);
  assert.equal(result.best, 'calculator');
});

test('findBestMatch returns the first candidate when nothing matches', () => {
  const result = ctx.findBestMatch('zzzz', ['chrome', 'calculator']);
  assert.equal(result.best, 'chrome');
  assert.equal(result.score, 0);
});

test('getFilesFor skips files matching any configured invalid extension', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lhub-test-'));
  try {
    fs.writeFileSync(path.join(tmp, 'notes.txt'), 'hi');
    fs.writeFileSync(path.join(tmp, '.gitignore'), 'node_modules');
    fs.writeFileSync(path.join(tmp, '.DS_Store'), '');

    const fileCtx = loadAppFinder({
      settings: {
        ...JSON.parse(fs.readFileSync(path.join(__dirname, '../config/settings.json'), 'utf8')),
        'search-files': {
          enabled: true,
          'starting-dirs': { 'desktop': true },
          'invalid-file-extensions': ['.gitignore', '.DS_Store'],
          'invalid-directories': [],
          'initial-max-depth': 1
        }
      }
    });
    fileCtx.getFilesFor(tmp, 1, 1);

    assert.ok(fileCtx.filesForSearch.includes('notes.txt'), 'notes.txt should be indexed');
    assert.ok(!fileCtx.filesForSearch.includes('.gitignore'), '.gitignore should be filtered');
    assert.ok(!fileCtx.filesForSearch.includes('.DS_Store'), '.DS_Store should be filtered');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
