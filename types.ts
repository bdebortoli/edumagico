
import { Type } from "@google/genai";

// User & Auth Types
export type UserRole = 'parent' | 'teacher' | 'admin';
export type PlanType = 'basic' | 'premium';
export type SubscriptionCycle = 'monthly' | 'yearly';

export interface Address {
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface BankDetails {
  bankName: string;
  accountType: 'checking' | 'savings';
  agency: string;
  accountNumber: string;
  pixKey?: string;
}

export interface CreditCardToken {
  last4: string;
  brand: string;
  token: string; // Simulated token from payment provider
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: PlanType;
  coins: number;
  cpf?: string;
  birthDate?: string;
  address?: Address;
  phoneNumber?: string;
  
  // Role specific data
  teacherProfile?: TeacherProfile;
  parentProfile?: ParentProfile;
  studentProfile?: StudentProfile;
  
  subscription?: SubscriptionDetails;
  activityHistory?: ActivityHistory[];
}

export interface TeacherProfile {
  bio?: string;
  subjects: string[];
  bankDetails?: BankDetails;
  totalEarnings: number;
}

export interface ParentProfile {
  paymentMethods: CreditCardToken[];
  childrenIds: string[];
}

export interface StudentProfile {
  parentId?: string;
  grade: string;
  school?: string;
  points: number;
  avatar?: string;
}

// Legacy ChildProfile support (can be refactored later to use User with role='student')
export interface ChildProfile extends StudentProfile {
  id: string;
  name: string;
  birthDate?: string; // Data de nascimento no formato ISO (YYYY-MM-DD)
  age?: number; // Calculado a partir de birthDate, mantido para compatibilidade
}

export interface ActivityHistory {
  id: string;
  childId: string;
  contentId: string;
  contentTitle: string;
  subject: string;
  score: number; // 0 to 100
  maxScore: number;
  completedAt: string;
}

// Content Types
export type ContentType = 'story' | 'quiz' | 'summary' | 'game';

export interface ContentResources {
  videoUrl?: string;
  audioUrl?: string;
  externalLink?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  subject: string;
  ageRange: { min: number; max: number }; // Changed from single targetAge
  grade?: string; 
  keywords?: string[]; 
  resources?: ContentResources;
  isAiGenerated: boolean;
  price: number; // 0 = free, >0 = premium marketplace content
  salesCount?: number; // Added for financial tracking
  data: StoryData | QuizData | SummaryData | GameData;
}

// Content Data Structures
export interface StoryData {
  chapters: {
    title: string;
    text: string;
    imageUrl?: string; // Placeholder logic
  }[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizData {
  questions: QuizQuestion[];
}

export interface SummaryData {
  keyPoints: string[];
  simpleExplanation: string;
  funFact: string;
}

export interface GameData {
  gameType: 'multiplication-table' | string;
  config?: any; // Additional game configuration
}

// Gemini Schema Response Types (used for parsing)
export interface GeneratedContentResponse {
  title: string;
  description: string;
  content: any; // Will be cast based on request type
}

export interface FileAttachment {
  mimeType: string;
  data: string; // base64
  name: string;
}
