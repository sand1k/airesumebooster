import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  firebaseId: text("firebase_id").notNull().unique()
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow()
});

export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  resumeId: serial("resume_id").references(() => resumes.id),
  content: text("content").notNull(),
  category: text("category").notNull(),
  improvement: text("improvement").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertResumeSchema = createInsertSchema(resumes).omit({ id: true, uploadedAt: true });
export const insertSuggestionSchema = createInsertSchema(suggestions).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type Suggestion = typeof suggestions.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
