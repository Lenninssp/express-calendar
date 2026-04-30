const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const calendarRoutes = require("./routes/calendars");
const eventRoutes = require("./routes/events");
const dashboardRoutes = require("./routes/dashboard");
const socketAuth = require("./middleware/socketAuth");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust in production
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// Pass socket.io to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO Connection Logic
io.use(socketAuth);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Join a room specific to the user for private notifications
  socket.join(socket.userId);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/calendars", calendarRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Example API route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// Serve frontend build
const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

// React fallback (SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

