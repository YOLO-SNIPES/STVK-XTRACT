import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import multer from "multer";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { processAudioWithDemucs } from "./ai-processor";
import type { AudioProject } from "@shared/schema";
import { 
  insertUserSchema,
  insertAudioProjectSchema, 
  insertAudioSampleSchema, 
  insertArrangementSchema,
  type User
} from "@shared/schema";

// Middleware to ensure user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/signup", async (req, res, next) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const user = await storage.createUser({ username, password });

      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log("/api/login: user authenticated, returning user object:", req.user);
    res.json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ success: true });
    });
  });

  app.get("/api/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  });

  // Audio Projects API
  app.post("/api/projects", isAuthenticated, upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file uploaded" });
      }

      const { name, duration } = req.body;
      const user = req.user as User;

      const project = await storage.createProject({
        name,
        duration: parseFloat(duration),
        filename: req.file.filename,
        size: req.file.size,
        userId: user.id,
        status: "uploaded",
      });

      // Trigger AI processing asynchronously, but don't block the request
      startAudioProcessing(project, req.file.path);

      res.status(201).json(project);
    } catch (error) {
      console.error("Project creation failed:", error);
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const projects = await storage.getUserProjects(user.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.get("/api/projects/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ status: project.status });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project status" });
    }
  });

  app.get("/api/projects/:id/stems", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project || project.status !== "completed") {
        return res.status(404).json({ error: "Stems not available for this project." });
      }

      // The stems are in separated/{project_id}/{project_name}/*
      const projectDir = path.join(process.cwd(), "separated", id.toString());
      // demucs creates a subdirectory with the model name
      const modelName = fs.readdirSync(projectDir)[0];
      const stemsDir = path.join(projectDir, modelName);

      const files = fs.readdirSync(stemsDir);
      const stemUrls = files.map(file => `/separated/${id}/${modelName}/${file}`);

      res.json(stemUrls);
    } catch (error) {
      console.error("Failed to fetch stems:", error);
      res.status(500).json({ error: "Failed to fetch stems" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertAudioProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, updates);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProject(id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Audio Samples API
  app.post("/api/samples", isAuthenticated, async (req, res) => {
    try {
      const sampleData = insertAudioSampleSchema.parse(req.body);
      const sample = await storage.createSample(sampleData);
      res.json(sample);
    } catch (error) {
      res.status(400).json({ error: "Invalid sample data" });
    }
  });

  app.get("/api/projects/:projectId/samples", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const samples = await storage.getProjectSamples(projectId);
      res.json(samples);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch samples" });
    }
  });

  app.delete("/api/samples/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSample(id);
      if (!success) {
        return res.status(404).json({ error: "Sample not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sample" });
    }
  });

  // Arrangements API
  app.post("/api/arrangements", isAuthenticated, async (req, res) => {
    try {
      const arrangementData = insertArrangementSchema.parse(req.body);
      const arrangement = await storage.createArrangement(arrangementData);
      res.json(arrangement);
    } catch (error) {
      res.status(400).json({ error: "Invalid arrangement data" });
    }
  });

  app.get("/api/projects/:projectId/arrangements", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const arrangements = await storage.getProjectArrangements(projectId);
      res.json(arrangements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch arrangements" });
    }
  });

  app.put("/api/arrangements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertArrangementSchema.partial().parse(req.body);
      const arrangement = await storage.updateArrangement(id, updates);
      if (!arrangement) {
        return res.status(4e4).json({ error: "Arrangement not found" });
      }
      res.json(arrangement);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/arrangements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteArrangement(id);
      if (!success) {
        return res.status(404).json({ error: "Arrangement not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete arrangement" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

async function startAudioProcessing(project: AudioProject, filePath: string) {
  try {
    await storage.updateProject(project.id, { status: "processing" });
    const outputDir = path.join(process.cwd(), "separated", project.id.toString());
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    await processAudioWithDemucs(filePath, outputDir);
    await storage.updateProject(project.id, { status: "completed" });
  } catch (err) {
    console.error(`Failed to process project ${project.id}:`, err);
    await storage.updateProject(project.id, { status: "failed" });
  }
}
