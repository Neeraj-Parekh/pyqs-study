/**
 * PYQs Study Platform - Progress Service
 * Tracks study progress, streaks, and achievements
 */

import { StudyProgress, DailyProgress, StudySession } from '../types';
import StudyPlatformPlugin from '../main';

export class ProgressService {
    private plugin: StudyPlatformPlugin;
    private progress: StudyProgress;
    private dailyProgress: Map<string, DailyProgress> = new Map();
    private sessions: StudySession[] = [];
    private dataFile = 'study-platform-progress.json';

    constructor(plugin: StudyPlatformPlugin) {
        this.plugin = plugin;
        this.progress = this.getDefaultProgress();
    }

    private getDefaultProgress(): StudyProgress {
        return {
            totalStudyTime: 0,
            sessionsCompleted: 0,
            notesCreated: 0,
            flashcardsCreated: 0,
            flashcardsReviewed: 0,
            pdfsRead: 0,
            ocrScansCompleted: 0,
            streakDays: 0,
            dailyGoalMinutes: this.plugin?.settings?.dailyGoalMinutes || 60,
            weeklyGoalMinutes: this.plugin?.settings?.weeklyGoalMinutes || 420,
        };
    }

    async loadProgress(): Promise<void> {
        try {
            const file = this.plugin.app.vault.getAbstractFileByPath(this.dataFile);
            if (file) {
                const content = await this.plugin.app.vault.read(file as any);
                const data = JSON.parse(content);
                this.progress = data.progress || this.getDefaultProgress();
                this.sessions = data.sessions || [];
                
                // Restore daily progress map
                if (data.dailyProgress) {
                    this.dailyProgress = new Map(Object.entries(data.dailyProgress));
                }
            }
        } catch (error) {
            console.log('No existing progress data found, starting fresh');
            this.progress = this.getDefaultProgress();
        }
    }

    async saveProgress(): Promise<void> {
        try {
            const data = {
                progress: this.progress,
                sessions: this.sessions,
                dailyProgress: Object.fromEntries(this.dailyProgress),
            };
            
            const content = JSON.stringify(data, null, 2);
            const file = this.plugin.app.vault.getAbstractFileByPath(this.dataFile);
            
            if (file) {
                await this.plugin.app.vault.modify(file as any, content);
            } else {
                await this.plugin.app.vault.create(this.dataFile, content);
            }
        } catch (error) {
            console.error('Failed to save progress data:', error);
        }
    }

    getProgress(): StudyProgress {
        return { ...this.progress };
    }

    private getTodayKey(): string {
        return new Date().toISOString().split('T')[0];
    }

    private getOrCreateDailyProgress(): DailyProgress {
        const today = this.getTodayKey();
        
        if (!this.dailyProgress.has(today)) {
            this.dailyProgress.set(today, {
                date: today,
                studyTime: 0,
                sessionsCompleted: 0,
                flashcardsReviewed: 0,
                goalMet: false,
            });
        }
        
        return this.dailyProgress.get(today)!;
    }

    getTodayStudyTime(): number {
        const daily = this.getOrCreateDailyProgress();
        return daily.studyTime;
    }

    async addSession(session: StudySession): Promise<void> {
        this.sessions.push(session);
        
        // Update overall progress
        this.progress.totalStudyTime += session.duration;
        this.progress.sessionsCompleted++;
        this.progress.flashcardsReviewed += session.flashcardsReviewed;
        this.progress.notesCreated += session.notesCreated;
        this.progress.lastStudyDate = new Date();
        
        // Update daily progress
        const daily = this.getOrCreateDailyProgress();
        daily.studyTime += session.duration;
        daily.sessionsCompleted++;
        daily.flashcardsReviewed += session.flashcardsReviewed;
        daily.goalMet = daily.studyTime >= this.plugin.settings.dailyGoalMinutes;
        
        // Update streak
        this.updateStreak();
        
        await this.saveProgress();
    }

    private updateStreak(): void {
        const today = this.getTodayKey();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const todayProgress = this.dailyProgress.get(today);
        const yesterdayProgress = this.dailyProgress.get(yesterday);
        
        if (todayProgress?.goalMet) {
            if (yesterdayProgress?.goalMet || this.progress.streakDays === 0) {
                // Continue or start streak
                if (!this.progress.lastStudyDate || 
                    new Date(this.progress.lastStudyDate).toISOString().split('T')[0] !== today) {
                    this.progress.streakDays++;
                }
            }
        }
    }

    async incrementNotesCreated(): Promise<void> {
        this.progress.notesCreated++;
        await this.saveProgress();
    }

    async incrementFlashcardsCreated(): Promise<void> {
        this.progress.flashcardsCreated++;
        await this.saveProgress();
    }

    async incrementFlashcardsReviewed(count: number = 1): Promise<void> {
        this.progress.flashcardsReviewed += count;
        
        const daily = this.getOrCreateDailyProgress();
        daily.flashcardsReviewed += count;
        
        await this.saveProgress();
    }

    async incrementPDFsRead(): Promise<void> {
        this.progress.pdfsRead++;
        await this.saveProgress();
    }

    async incrementOCRScans(): Promise<void> {
        this.progress.ocrScansCompleted++;
        await this.saveProgress();
    }

    async addStudyTime(minutes: number): Promise<void> {
        this.progress.totalStudyTime += minutes;
        
        const daily = this.getOrCreateDailyProgress();
        daily.studyTime += minutes;
        daily.goalMet = daily.studyTime >= this.plugin.settings.dailyGoalMinutes;
        
        this.updateStreak();
        await this.saveProgress();
    }

    getWeeklyProgress(): DailyProgress[] {
        const result: DailyProgress[] = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const key = date.toISOString().split('T')[0];
            
            const daily = this.dailyProgress.get(key) || {
                date: key,
                studyTime: 0,
                sessionsCompleted: 0,
                flashcardsReviewed: 0,
                goalMet: false,
            };
            
            result.push(daily);
        }
        
        return result;
    }

    getWeeklyStudyTime(): number {
        return this.getWeeklyProgress().reduce((sum, day) => sum + day.studyTime, 0);
    }

    getMonthlyProgress(): DailyProgress[] {
        const result: DailyProgress[] = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const key = date.toISOString().split('T')[0];
            
            const daily = this.dailyProgress.get(key) || {
                date: key,
                studyTime: 0,
                sessionsCompleted: 0,
                flashcardsReviewed: 0,
                goalMet: false,
            };
            
            result.push(daily);
        }
        
        return result;
    }

    getRecentSessions(limit: number = 10): StudySession[] {
        return [...this.sessions]
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
            .slice(0, limit);
    }

    getAchievements(): { id: string; name: string; description: string; unlocked: boolean; progress: number }[] {
        return [
            {
                id: 'first-session',
                name: 'Getting Started',
                description: 'Complete your first study session',
                unlocked: this.progress.sessionsCompleted >= 1,
                progress: Math.min(100, this.progress.sessionsCompleted * 100),
            },
            {
                id: 'ten-sessions',
                name: 'Dedicated Learner',
                description: 'Complete 10 study sessions',
                unlocked: this.progress.sessionsCompleted >= 10,
                progress: Math.min(100, (this.progress.sessionsCompleted / 10) * 100),
            },
            {
                id: 'hundred-flashcards',
                name: 'Card Master',
                description: 'Create 100 flashcards',
                unlocked: this.progress.flashcardsCreated >= 100,
                progress: Math.min(100, this.progress.flashcardsCreated),
            },
            {
                id: 'week-streak',
                name: 'Consistent',
                description: 'Maintain a 7-day study streak',
                unlocked: this.progress.streakDays >= 7,
                progress: Math.min(100, (this.progress.streakDays / 7) * 100),
            },
            {
                id: 'month-streak',
                name: 'Unstoppable',
                description: 'Maintain a 30-day study streak',
                unlocked: this.progress.streakDays >= 30,
                progress: Math.min(100, (this.progress.streakDays / 30) * 100),
            },
            {
                id: 'ten-pdfs',
                name: 'Bookworm',
                description: 'Read 10 PDF documents',
                unlocked: this.progress.pdfsRead >= 10,
                progress: Math.min(100, (this.progress.pdfsRead / 10) * 100),
            },
            {
                id: 'first-ocr',
                name: 'Text Extractor',
                description: 'Complete your first OCR scan',
                unlocked: this.progress.ocrScansCompleted >= 1,
                progress: Math.min(100, this.progress.ocrScansCompleted * 100),
            },
            {
                id: 'thousand-minutes',
                name: 'Time Investor',
                description: 'Study for 1000 minutes total',
                unlocked: this.progress.totalStudyTime >= 1000,
                progress: Math.min(100, (this.progress.totalStudyTime / 1000) * 100),
            },
        ];
    }

    async resetProgress(): Promise<void> {
        this.progress = this.getDefaultProgress();
        this.dailyProgress.clear();
        this.sessions = [];
        await this.saveProgress();
    }
}
