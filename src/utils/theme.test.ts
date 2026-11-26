import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInitialTheme, toggleThemeMode } from './theme.ts';

test('resolveInitialTheme honors explicit stored theme over system preference', () => {
  assert.equal(resolveInitialTheme({ stored: 'dark', prefersDark: false }), 'dark');
  assert.equal(resolveInitialTheme({ stored: 'light', prefersDark: true }), 'light');
});

test('resolveInitialTheme falls back to system preference when stored value is absent or invalid', () => {
  assert.equal(resolveInitialTheme({ stored: null, prefersDark: true }), 'dark');
  assert.equal(resolveInitialTheme({ stored: 'invalid', prefersDark: false }), 'light');
  assert.equal(resolveInitialTheme({}), 'light');
});

test('toggleThemeMode flips between light and dark', () => {
  assert.equal(toggleThemeMode('light'), 'dark');
  assert.equal(toggleThemeMode('dark'), 'light');
});
