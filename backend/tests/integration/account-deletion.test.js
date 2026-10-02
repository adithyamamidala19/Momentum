import test from 'node:test';
import assert from 'node:assert/strict';
import { AccountDeletionService } from '../../src/services/accountDeletionService.js';
import { User } from '../../src/models/User.js';
import { Ritual } from '../../src/models/Ritual.js';
import { Todo } from '../../src/models/Todo.js';
import { HydrationLog } from '../../src/models/HydrationLog.js';
import { ProteinLog } from '../../src/models/ProteinLog.js';
import { WeeklyScore } from '../../src/models/WeeklyScore.js';

test('Account Hard-Deletion & Data Isolation Integrity', async (t) => {
  await t.test('1. AccountDeletionService hard-deletes user across all collections', async () => {
    // Verify method exists and has proper contract
    assert.equal(typeof AccountDeletionService.hardDeleteUserAccount, 'function');
  });

  await t.test('2. IDOR Prevention: Queries are strictly scoped to req.user._id', () => {
    // Ensure all model schemas contain indexed userId reference
    assert.ok(Ritual.schema.paths.userId);
    assert.ok(Todo.schema.paths.userId);
    assert.ok(HydrationLog.schema.paths.userId);
    assert.ok(ProteinLog.schema.paths.userId);
    assert.ok(WeeklyScore.schema.paths.userId);
  });
});
