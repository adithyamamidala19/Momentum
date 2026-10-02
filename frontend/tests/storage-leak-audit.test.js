import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { purgeLegacyClientStorage } from '../src/services/storagePurge.js';

describe('Storage Leak Audit & Zero-Client-Persistence Verification', () => {
  test('Scans all src/ files to ensure zero calls to localStorage, sessionStorage, or indexedDB outside purge', () => {
    const srcDir = fs.existsSync(path.resolve('src')) 
      ? path.resolve('src') 
      : path.resolve('frontend/src');
    const forbiddenPatterns = [
      /\blocalStorage\./,
      /\bsessionStorage\./,
      /\bindexedDB\./,
      /window\[['"]localStorage['"]\]/,
      /window\[['"]sessionStorage['"]\]/,
      /window\[['"]indexedDB['"]\]/
    ];

    const violations = [];

    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
          // storagePurge.js is the designated purge utility
          if (entry.name === 'storagePurge.js') continue;

          let content = fs.readFileSync(fullPath, 'utf8');
          // Strip comments so explanatory security comments don't false-positive
          content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
          forbiddenPatterns.forEach((pat) => {
            if (pat.test(content)) {
              violations.push(`${path.relative(srcDir, fullPath)} matched forbidden pattern ${pat}`);
            }
          });
        }
      }
    }

    scanDir(srcDir);
    assert.deepEqual(violations, [], `Forbidden storage API calls found in production code:\n${violations.join('\n')}`);
  });

  test('purgeLegacyClientStorage wipes mock window storage without throwing', () => {
    let lsCleared = false;
    let ssCleared = false;
    let idbDeleted = [];

    global.window = {
      localStorage: {
        clear: () => { lsCleared = true; }
      },
      sessionStorage: {
        clear: () => { ssCleared = true; }
      },
      indexedDB: {
        deleteDatabase: (name) => { idbDeleted.push(name); },
        databases: async () => [{ name: 'legacy-db' }]
      }
    };

    purgeLegacyClientStorage();

    assert.equal(lsCleared, true, 'localStorage should have been cleared');
    assert.equal(ssCleared, true, 'sessionStorage should have been cleared');
    assert.ok(idbDeleted.includes('firebaseLocalStorageDb'), 'firebaseLocalStorageDb deleted');
  });
});
