require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const historyRoutes = require("./routes/historyRoutes");

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.CLIENT_URL
  ],
  credentials: true
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json()); // Allow passing JSON data in the body

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.send("Cybersecurity App API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
