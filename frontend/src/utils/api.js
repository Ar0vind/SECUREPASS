export const API_URL = 'http://localhost:5000/api';

/**
 * Records an activity event (a breach check or a password generation) to
 * the account's history. This is intentionally "fire and forget": if it
 * fails, we don't want to interrupt the tool the user is actually using.
 *
 * Only metadata is ever sent here — never the password itself. See
 * backend/models/History.js for why.
 */
export const logHistory = async (token, payload) => {
  if (!token) return;

  try {
    await fetch(`${API_URL}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Best-effort only — history logging should never block the main flow.
    console.warn('Could not save history entry:', err);
  }
};
