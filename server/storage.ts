import { 
  users, 
  audioProjects, 
  audioSamples, 
  arrangements,
  type User, 
  type InsertUser,
  type AudioProject,
  type InsertAudioProject,
  type AudioSample,
  type InsertAudioSample,
  type Arrangement,
  type InsertArrangement
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Audio project methods
  createProject(project: InsertAudioProject & { userId: number }): Promise<AudioProject>;
  getProject(id: number): Promise<AudioProject | undefined>;
  getUserProjects(userId: number): Promise<AudioProject[]>;
  updateProject(id: number, updates: Partial<InsertAudioProject>): Promise<AudioProject | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Audio sample methods
  createSample(sample: InsertAudioSample): Promise<AudioSample>;
  getProjectSamples(projectId: number): Promise<AudioSample[]>;
  deleteSample(id: number): Promise<boolean>;
  
  // Arrangement methods
  createArrangement(arrangement: InsertArrangement): Promise<Arrangement>;
  getProjectArrangements(projectId: number): Promise<Arrangement[]>;
  updateArrangement(id: number, updates: Partial<InsertArrangement>): Promise<Arrangement | undefined>;
  deleteArrangement(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Audio project methods
  async createProject(project: InsertAudioProject & { userId: number }): Promise<AudioProject> {
    const [newProject] = await db
      .insert(audioProjects)
      .values(project)
      .returning();
    return newProject;
  }

  async getProject(id: number): Promise<AudioProject | undefined> {
    const [project] = await db.select().from(audioProjects).where(eq(audioProjects.id, id));
    return project || undefined;
  }

  async getUserProjects(userId: number): Promise<AudioProject[]> {
    return await db.select().from(audioProjects).where(eq(audioProjects.userId, userId));
  }

  async updateProject(id: number, updates: Partial<InsertAudioProject>): Promise<AudioProject | undefined> {
    const [updatedProject] = await db
      .update(audioProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(audioProjects.id, id))
      .returning();
    return updatedProject || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(audioProjects).where(eq(audioProjects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Audio sample methods
  async createSample(sample: InsertAudioSample): Promise<AudioSample> {
    const [newSample] = await db
      .insert(audioSamples)
      .values(sample)
      .returning();
    return newSample;
  }

  async getProjectSamples(projectId: number): Promise<AudioSample[]> {
    return await db.select().from(audioSamples).where(eq(audioSamples.projectId, projectId));
  }

  async deleteSample(id: number): Promise<boolean> {
    const result = await db.delete(audioSamples).where(eq(audioSamples.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Arrangement methods
  async createArrangement(arrangement: InsertArrangement): Promise<Arrangement> {
    const [newArrangement] = await db
      .insert(arrangements)
      .values(arrangement)
      .returning();
    return newArrangement;
  }

  async getProjectArrangements(projectId: number): Promise<Arrangement[]> {
    return await db.select().from(arrangements).where(eq(arrangements.projectId, projectId));
  }

  async updateArrangement(id: number, updates: Partial<InsertArrangement>): Promise<Arrangement | undefined> {
    const [updatedArrangement] = await db
      .update(arrangements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(arrangements.id, id))
      .returning();
    return updatedArrangement || undefined;
  }

  async deleteArrangement(id: number): Promise<boolean> {
    const result = await db.delete(arrangements).where(eq(arrangements.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
