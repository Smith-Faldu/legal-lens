// ===============================
// Main server file with comprehensive setup
// ===============================
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Routes
import analyzeRoutes from "./routes/analyzeRoutes.js";
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/documentRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/auth.js";
import { requestLogger } from "./middleware/logger.js";
import { validateEnvironment } from "./middleware/environment.js";

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Validate environment variables
try {
  validateEnvironment();
} catch (error) {
  console.warn("⚠️ Environment validation warning:", error.message);
}

// ===============================
// Global Middleware
// ===============================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(requestLogger);

// ===============================
// Service Initialization
// ===============================
const initializeServices = async () => {
  try {
    console.log("🔄 Initializing services...");

    // Try to initialize services if they exist
    try {
      const { initializeGoogleClients } = await import("./config/googleClients.js");
      await initializeGoogleClients();
      console.log("✅ Google Cloud clients initialized");
    } catch (error) {
      console.warn("⚠️ Google Cloud clients initialization skipped:", error.message);
    }

    try {
      const { initializeFirebaseAdmin } = await import("./services/firebaseAdmin.js");
      await initializeFirebaseAdmin();
      console.log("✅ Firebase Admin initialized");
    } catch (error) {
      console.warn("⚠️ Firebase Admin initialization skipped:", error.message);
    }

    try {
      const { initializeGemini } = await import("./services/geminiService.js");
      await initializeGemini();
      console.log("✅ Gemini AI initialized");
    } catch (error) {
      console.warn("⚠️ Gemini AI initialization skipped:", error.message);
    }

    try {
      const { initializeGoogleCloud } = await import("./services/googleCloud.js");
      await initializeGoogleCloud();
      console.log("✅ Google Cloud Storage initialized");
    } catch (error) {
      console.warn("⚠️ Google Cloud Storage initialization skipped:", error.message);
    }

    console.log("✅ Service initialization completed");

  } catch (error) {
    console.warn("⚠️ Some services failed to initialize:", error.message);
    // Don't exit, let the server start anyway
  }
};

// ===============================
// Routes
// ===============================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/analyze", authMiddleware, analyzeRoutes);
app.use("/api/documents", authMiddleware, documentRoutes);
app.use("/api/history", authMiddleware, historyRoutes);
app.use("/api/upload", authMiddleware, uploadRoutes);

// API documentation
app.get("/api", (req, res) => {
  res.json({
    message: "Legal Lens API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      analyze: "/api/analyze",
      documents: "/api/documents",
      history: "/api/history",
      upload: "/api/upload",
      health: "/health",
    },
  });
});

// ===============================
// Error Handling
// ===============================
app.use(errorHandler);

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// ===============================
// Server Start
// ===============================
const startServer = async () => {
  try {
    // Initialize services (non-blocking)
    await initializeServices();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  console.log("Server will continue running...");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  console.log("Server will continue running...");
});

startServer();

export default app;
