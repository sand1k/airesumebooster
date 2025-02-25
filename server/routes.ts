import type { Express, Request } from "express";
import { createServer } from "http";
import multer from "multer";
import { storage } from "./storage";
import { analyzeResume } from "../client/src/lib/openai";
import { insertUserSchema, insertResumeSchema, insertSuggestionSchema } from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user?: { id: number };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export async function registerRoutes(app: Express) {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Resume routes
  app.get("/api/resumes", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const resumes = await storage.getResumesByUserId(userId);
    res.json(resumes);
  });

  app.get("/api/resumes/:id", async (req, res) => {
    const resume = await storage.getResume(parseInt(req.params.id));
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    res.json(resume);
  });

  app.post("/api/resumes/upload", upload.single("file"), async (req: AuthenticatedRequest, res) => {
    if (!req.file || !req.user?.id) {
      return res.status(400).json({ message: "No file uploaded or user not authenticated" });
    }

    try {
      // Store file and get URL
      const fileUrl = `data:application/pdf;base64,${req.file.buffer.toString("base64")}`;

      const resume = await storage.createResume({
        userId: req.user.id,
        fileUrl
      });

      // Analyze resume and create suggestions
      const suggestions = await analyzeResume(req.file.buffer.toString());

      for (const suggestion of suggestions) {
        await storage.createSuggestion({
          resumeId: resume.id,
          ...suggestion
        });
      }

      res.json(resume);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/resumes/:id/suggestions", async (req, res) => {
    const suggestions = await storage.getSuggestionsByResumeId(parseInt(req.params.id));
    res.json(suggestions);
  });

  const httpServer = createServer(app);
  return httpServer;
}