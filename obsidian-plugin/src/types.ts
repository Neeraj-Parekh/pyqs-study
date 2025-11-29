/**
 * PYQs Study Platform - Type Definitions
 * Core types and interfaces for the study platform
 */

// Study Session Types
export interface StudySession {
    id: string;
    startTime: Date;
    endTime?: Date;
    duration: number; // in minutes
    topicsCovered: string[];
    notesCreated: number;
    flashcardsReviewed: number;
}

// Flashcard Types
export interface Flashcard {
    id: string;
    front: string;
    back: string;
    deck: string;
    tags: string[];
    createdAt: Date;
    lastReviewed?: Date;
    nextReview?: Date;
    easeFactor: number; // SM-2 algorithm ease factor
    interval: number; // days until next review
    repetitions: number;
}

export interface FlashcardDeck {
    id: string;
    name: string;
    description: string;
    cards: Flashcard[];
    createdAt: Date;
    lastStudied?: Date;
}

// PDF Types
export interface PDFDocument {
    id: string;
    path: string;
    name: string;
    totalPages: number;
    currentPage: number;
    bookmarks: PDFBookmark[];
    annotations: PDFAnnotation[];
    lastOpened: Date;
}

export interface PDFBookmark {
    id: string;
    pageNumber: number;
    title: string;
    createdAt: Date;
}

export interface PDFAnnotation {
    id: string;
    pageNumber: number;
    type: 'highlight' | 'underline' | 'note' | 'drawing';
    content: string;
    color: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    createdAt: Date;
}

// OCR Types
export interface OCRResult {
    id: string;
    sourceFile: string;
    pageNumber?: number;
    text: string;
    confidence: number;
    processedAt: Date;
    language: string;
}

// Progress Tracking Types
export interface StudyProgress {
    totalStudyTime: number; // in minutes
    sessionsCompleted: number;
    notesCreated: number;
    flashcardsCreated: number;
    flashcardsReviewed: number;
    pdfsRead: number;
    ocrScansCompleted: number;
    streakDays: number;
    lastStudyDate?: Date;
    dailyGoalMinutes: number;
    weeklyGoalMinutes: number;
}

export interface DailyProgress {
    date: string; // YYYY-MM-DD
    studyTime: number;
    sessionsCompleted: number;
    flashcardsReviewed: number;
    goalMet: boolean;
}

// Note Types
export interface StudyNote {
    id: string;
    title: string;
    content: string;
    folder: string;
    tags: string[];
    linkedPDFs: string[];
    linkedFlashcards: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Timer Types
export interface PomodoroSession {
    id: string;
    type: 'work' | 'shortBreak' | 'longBreak';
    duration: number; // in minutes
    startTime: Date;
    endTime?: Date;
    completed: boolean;
}

export interface PomodoroSettings {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
}

// Plugin Settings
export interface StudyPlatformSettings {
    // General
    showStatusBar: boolean;
    enableNotifications: boolean;
    
    // PDF Settings
    defaultPDFZoom: number;
    pdfAnnotationColor: string;
    autoSaveAnnotations: boolean;
    
    // OCR Settings
    ocrLanguage: string;
    ocrAutoProcess: boolean;
    
    // Flashcard Settings
    newCardsPerDay: number;
    reviewCardsPerDay: number;
    easeBonus: number;
    intervalModifier: number;
    
    // Pomodoro Settings
    pomodoro: PomodoroSettings;
    
    // Progress Tracking
    dailyGoalMinutes: number;
    weeklyGoalMinutes: number;
    showProgressInStatusBar: boolean;
    
    // Study Session
    autoStartSession: boolean;
    sessionReminderInterval: number; // minutes
}

export const DEFAULT_SETTINGS: StudyPlatformSettings = {
    showStatusBar: true,
    enableNotifications: true,
    
    defaultPDFZoom: 100,
    pdfAnnotationColor: '#ffeb3b',
    autoSaveAnnotations: true,
    
    ocrLanguage: 'eng',
    ocrAutoProcess: false,
    
    newCardsPerDay: 20,
    reviewCardsPerDay: 100,
    easeBonus: 1.3,
    intervalModifier: 1.0,
    
    pomodoro: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartPomodoros: false,
    },
    
    dailyGoalMinutes: 60,
    weeklyGoalMinutes: 420,
    showProgressInStatusBar: true,
    
    autoStartSession: false,
    sessionReminderInterval: 30,
};
