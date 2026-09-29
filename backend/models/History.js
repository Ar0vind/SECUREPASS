const mongoose = require("mongoose");

/**
 * IMPORTANT: This collection intentionally never stores the password itself
 * (raw, hashed, or partially hashed) for either action type below. SecurePass's
 * whole premise is that passwords never leave the browser, so history only
 * ever records *metadata* about what happened — enough to show a useful
 * timeline without turning the database into a target.
 */
const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["breach_check", "password_generated"],
      required: true,
    },

    // --- fields used when action === "breach_check" ---
    breached: {
      type: Boolean,
      default: undefined,
    },
    breachCount: {
      type: Number,
      default: undefined,
    },

    // --- fields used when action === "password_generated" ---
    length: {
      type: Number,
      default: undefined,
    },
    options: {
      type: {
        uppercase: Boolean,
        lowercase: Boolean,
        numbers: Boolean,
        symbols: Boolean,
      },
      default: undefined,
    },
    strength: {
      type: String,
      enum: ["Weak", "Moderate", "Strong", undefined],
      default: undefined,
    },
  },
  { timestamps: true },
);

historySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("History", historySchema);
