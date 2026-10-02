import { User } from '../models/User.js';

export const USERNAME_TAKEN_MESSAGE = 'This username is already taken. Please choose another username.';

/**
 * Checks whether a given username or nickname is already taken (case-insensitively).
 * Prevents multiple users from having the same username or challenge nickname.
 * 
 * @param {string|import('mongoose').Types.ObjectId|null} currentUserId - Exclude current user from search
 * @param {Object} candidate - { username, nickname, displayName }
 * @param {import('mongoose').Model} [UserModel=User] - Optional model injection for testing
 * @returns {Promise<{ taken: boolean, message?: string }>}
 */
export async function isUsernameTaken(currentUserId, { username, nickname, displayName } = {}, UserModel = User) {
  const candidatesToCheck = [];

  if (username && typeof username === 'string' && username.trim()) {
    candidatesToCheck.push(username.trim());
  }
  if (nickname && typeof nickname === 'string' && nickname.trim()) {
    candidatesToCheck.push(nickname.trim());
  }

  if (candidatesToCheck.length === 0) {
    return { taken: false };
  }

  for (const name of candidatesToCheck) {
    const lower = name.toLowerCase();
    const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}$`, 'i');

    const query = {
      $or: [
        { 'challenge.nickname': { $regex: regex } },
        { challengeNicknameLower: lower },
        { username: { $regex: regex } },
        { usernameLower: lower }
      ]
    };

    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }

    const model = UserModel || User;
    const existing = await model.findOne(query).select('_id displayName challenge.nickname');
    if (existing) {
      return {
        taken: true,
        message: USERNAME_TAKEN_MESSAGE
      };
    }
  }

  return { taken: false };
}
