import { User } from '../models/User.js';
import { Ritual } from '../models/Ritual.js';
import { RitualLog } from '../models/RitualLog.js';
import { Todo } from '../models/Todo.js';
import { HydrationLog } from '../models/HydrationLog.js';
import { ProteinLog } from '../models/ProteinLog.js';
import { FocusSession } from '../models/FocusSession.js';
import { Workout } from '../models/Workout.js';
import { Exercise } from '../models/Exercise.js';
import { PersonalRecord } from '../models/PersonalRecord.js';
import { CardioLog } from '../models/CardioLog.js';
import { AriaMessage } from '../models/AriaMessage.js';
import { WeeklyScore } from '../models/WeeklyScore.js';
import { Medal } from '../models/Medal.js';
import { getAuth } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

export class AccountDeletionService {
  /**
   * Hard-deletes all data for a user across all MongoDB collections and deletes the Firebase Auth identity.
   */
  static async hardDeleteUserAccount(userId, firebaseUid) {
    logger.warn({ msg: 'Initiating permanent account hard-deletion', userId, firebaseUid });

    // 1. Delete all documents across all collections in parallel
    const deleteResults = await Promise.all([
      Ritual.deleteMany({ userId }),
      RitualLog.deleteMany({ userId }),
      Todo.deleteMany({ userId }),
      HydrationLog.deleteMany({ userId }),
      ProteinLog.deleteMany({ userId }),
      FocusSession.deleteMany({ userId }),
      Workout.deleteMany({ userId }),
      Exercise.deleteMany({ userId }),
      PersonalRecord.deleteMany({ userId }),
      CardioLog.deleteMany({ userId }),
      AriaMessage.deleteMany({ userId }),
      WeeklyScore.deleteMany({ userId }),
      Medal.deleteMany({ userId }),
      User.deleteOne({ _id: userId })
    ]);

    // 2. Delete user from Firebase Authentication through Admin SDK
    if (firebaseUid) {
      try {
        const auth = getAuth();
        await auth.deleteUser(firebaseUid);
        logger.info({ msg: 'Successfully deleted Firebase user identity', firebaseUid });
      } catch (authError) {
        logger.error({ msg: 'Failed to delete user in Firebase Admin SDK', firebaseUid, err: authError.message });
        // Don't fail the DB cleanup if Firebase user was already deleted
      }
    }

    logger.info({ msg: 'Permanent account deletion completed successfully', userId });
    return {
      success: true,
      deletedCollectionsCount: deleteResults.length
    };
  }
}
