console.log("Starting server/index.ts");
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
console.log("Imports complete");
import passport from "passport";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializePassport, session as passportSession } from "./auth";
import { pool } from "./db";

const app = express();
console.log("Express app created");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// TODO: Use a proper secret in a production environment
app.use(session({
  store: new (ConnectPgSimple(session))({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: 'a-super-secret-key-that-should-be-in-env',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  }
}));
console.log("Session middleware configured");

app.use(initializePassport());
app.use(passportSession());
console.log("Passport configured");

app.use('/uploads', express.static('uploads'));
app.use('/separated', express.static('separated'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

import { buildDockerImage } from "./ai-processor";

(async () => {
  console.log("Starting async setup");
  await buildDockerImage().catch(err => {
    console.error("Failed to build Docker image on startup:", err);
    // We can decide if we want to exit the process if Docker is essential
    // process.exit(1);
  });
  console.log("Docker image build process finished");

  const server = await registerRoutes(app);
  console.log("Routes registered");

  // Centralized error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error("Error handler reached:", err.stack);

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({
      error: {
        message,
        status,
      },
    });
  });
  console.log("Error handler configured");


  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    console.log("Setting up Vite");
    await setupVite(app, server);
    console.log("Vite setup complete");
  } else {
    console.log("Serving static files");
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  console.log(`Preparing to listen on port ${port}`);
  const host = process.env.HOST || "0.0.0.0";
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();