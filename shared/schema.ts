import { pgTable, text, serial, integer, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

import { pgEnum } from "drizzle-orm/pg-core";

export const projectStatusEnum = pgEnum("project_status", ["uploaded", "processing", "completed", "failed"]);

export const audioProjects = pgTable("audio_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  duration: real("duration"),
  size: integer("size"),
  status: projectStatusEnum("status").default("uploaded"),
  extractionSettings: jsonb("extraction_settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const audioSamples = pgTable("audio_samples", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => audioProjects.id),
  name: text("name").notNull(),
  startTime: real("start_time").notNull(),
  endTime: real("end_time").notNull(),
  duration: text("duration").notNull(),
  waveform: jsonb("waveform"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const arrangements = pgTable("arrangements", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => audioProjects.id),
  name: text("name").notNull(),
  bpm: integer("bpm").default(120),
  samples: jsonb("samples"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(audioProjects),
}));

export const audioProjectsRelations = relations(audioProjects, ({ one, many }) => ({
  user: one(users, {
    fields: [audioProjects.userId],
    references: [users.id],
  }),
  samples: many(audioSamples),
  arrangements: many(arrangements),
}));

export const audioSamplesRelations = relations(audioSamples, ({ one }) => ({
  project: one(audioProjects, {
    fields: [audioSamples.projectId],
    references: [audioProjects.id],
  }),
}));

export const arrangementsRelations = relations(arrangements, ({ one }) => ({
  project: one(audioProjects, {
    fields: [arrangements.projectId],
    references: [audioProjects.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAudioProjectSchema = createInsertSchema(audioProjects).pick({
  name: true,
  filename: true,
  duration: true,
  size: true,
  extractionSettings: true,
  status: true,
});

export const insertAudioSampleSchema = createInsertSchema(audioSamples).pick({
  projectId: true,
  name: true,
  startTime: true,
  endTime: true,
  duration: true,
  waveform: true,
});

export const insertArrangementSchema = createInsertSchema(arrangements).pick({
  projectId: true,
  name: true,
  bpm: true,
  samples: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAudioProject = z.infer<typeof insertAudioProjectSchema>;
export type AudioProject = typeof audioProjects.$inferSelect;
export type InsertAudioSample = z.infer<typeof insertAudioSampleSchema>;
export type AudioSample = typeof audioSamples.$inferSelect;
export type InsertArrangement = z.infer<typeof insertArrangementSchema>;
export type Arrangement = typeof arrangements.$inferSelect;
