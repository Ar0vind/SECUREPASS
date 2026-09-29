const History = require("../models/History");

const HISTORY_LIMIT = 100;

// @desc    Get the logged-in user's activity history, newest first
// @route   GET /api/history
const getHistory = async (req, res) => {
  try {
    const history = await History.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT);

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Log a breach check or password generation event
// @route   POST /api/history
const addHistory = async (req, res) => {
  try {
    const { action, breached, breachCount, length, options, strength } = req.body;

    if (!["breach_check", "password_generated"].includes(action)) {
      return res.status(400).json({ message: "Invalid history action" });
    }

    const entry = await History.create({
      user: req.user._id,
      action,
      ...(action === "breach_check" && {
        breached: Boolean(breached),
        breachCount: typeof breachCount === "number" ? breachCount : undefined,
      }),
      ...(action === "password_generated" && {
        length,
        options,
        strength,
      }),
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Clear all of the logged-in user's activity history
// @route   DELETE /api/history
const clearHistory = async (req, res) => {
  try {
    await History.deleteMany({ user: req.user._id });
    res.status(200).json({ message: "History cleared" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getHistory, addHistory, clearHistory };
