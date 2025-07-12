import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAudioProjectSchema, 
  insertAudioSampleSchema, 
  insertArrangementSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Audio Projects API
  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertAudioProjectSchema.parse(req.body);
      // For now, using a mock user ID - in real app this would come from auth
      const project = await storage.createProject({ ...projectData, userId: 1 });
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      // For now, using a mock user ID - in real app this would come from auth
      const projects = await storage.getUserProjects(1);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
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

  app.put("/api/projects/:id", async (req, res) => {
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

  app.delete("/api/projects/:id", async (req, res) => {
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
  app.post("/api/samples", async (req, res) => {
    try {
      const sampleData = insertAudioSampleSchema.parse(req.body);
      const sample = await storage.createSample(sampleData);
      res.json(sample);
    } catch (error) {
      res.status(400).json({ error: "Invalid sample data" });
    }
  });

  app.get("/api/projects/:projectId/samples", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const samples = await storage.getProjectSamples(projectId);
      res.json(samples);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch samples" });
    }
  });

  app.delete("/api/samples/:id", async (req, res) => {
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
  app.post("/api/arrangements", async (req, res) => {
    try {
      const arrangementData = insertArrangementSchema.parse(req.body);
      const arrangement = await storage.createArrangement(arrangementData);
      res.json(arrangement);
    } catch (error) {
      res.status(400).json({ error: "Invalid arrangement data" });
    }
  });

  app.get("/api/projects/:projectId/arrangements", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const arrangements = await storage.getProjectArrangements(projectId);
      res.json(arrangements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch arrangements" });
    }
  });

  app.put("/api/arrangements/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertArrangementSchema.partial().parse(req.body);
      const arrangement = await storage.updateArrangement(id, updates);
      if (!arrangement) {
        return res.status(404).json({ error: "Arrangement not found" });
      }
      res.json(arrangement);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/arrangements/:id", async (req, res) => {
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
