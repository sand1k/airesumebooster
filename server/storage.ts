import type { User, InsertUser, Resume, InsertResume, Suggestion, InsertSuggestion } from "@shared/schema";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
  createResume(resume: InsertResume): Promise<Resume>;
  getResume(id: number): Promise<Resume | undefined>;
  getResumesByUserId(userId: number): Promise<Resume[]>;
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  getSuggestionsByResumeId(resumeId: number): Promise<Suggestion[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resumes: Map<number, Resume>;
  private suggestions: Map<number, Suggestion>;
  private currentIds: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.resumes = new Map();
    this.suggestions = new Map();
    this.currentIds = {
      users: 1,
      resumes: 1,
      suggestions: 1
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { 
      id,
      name: insertUser.name,
      email: insertUser.email,
      photoUrl: insertUser.photoUrl ?? null,
      firebaseId: insertUser.firebaseId
    };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseId === firebaseId
    );
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.currentIds.resumes++;
    const resume: Resume = {
      id,
      userId: insertResume.userId,
      fileUrl: insertResume.fileUrl,
      uploadedAt: new Date()
    };
    this.resumes.set(id, resume);
    return resume;
  }

  async getResume(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }

  async getResumesByUserId(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(
      (resume) => resume.userId === userId
    );
  }

  async createSuggestion(insertSuggestion: InsertSuggestion): Promise<Suggestion> {
    const id = this.currentIds.suggestions++;
    const suggestion: Suggestion = {
      id,
      resumeId: insertSuggestion.resumeId,
      content: insertSuggestion.content,
      category: insertSuggestion.category,
      improvement: insertSuggestion.improvement,
      createdAt: new Date()
    };
    this.suggestions.set(id, suggestion);
    return suggestion;
  }

  async getSuggestionsByResumeId(resumeId: number): Promise<Suggestion[]> {
    return Array.from(this.suggestions.values()).filter(
      (suggestion) => suggestion.resumeId === resumeId
    );
  }
}

export const storage = new MemStorage();