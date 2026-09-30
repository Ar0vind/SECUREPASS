const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const historyRoutes = require("./routes/historyRoutes");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allow passing JSON data in the body

// Routes
app.use("/auth", authRoutes);
app.use("/history", historyRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.send("Cybersecurity App API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
