/**
 * PYQs Study Platform - Progress View
 * Track your learning journey
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import StudyPlatformPlugin from '../main';

export const PROGRESS_VIEW_TYPE = 'pyqs-progress-view';

export class ProgressView extends ItemView {
    private plugin: StudyPlatformPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: StudyPlatformPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return PROGRESS_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'Study Progress';
    }

    getIcon(): string {
        return 'bar-chart-2';
    }

    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        container.addClass('pyqs-progress-view');

        this.renderView(container);
    }

    private renderView(container: HTMLElement) {
        container.empty();

        const progress = this.plugin.progressService.getProgress();
        const todayTime = this.plugin.progressService.getTodayStudyTime();
        const weeklyTime = this.plugin.progressService.getWeeklyStudyTime();
        const weeklyProgress = this.plugin.progressService.getWeeklyProgress();
        const achievements = this.plugin.progressService.getAchievements();
        const recentSessions = this.plugin.progressService.getRecentSessions(5);

        // Header
        const header = container.createDiv({ cls: 'progress-header' });
        header.createEl('h1', { text: '📊 Your Study Progress' });
        header.createEl('p', { text: 'Track your learning journey', cls: 'progress-subtitle' });

        // Today's Progress Card
        const todayCard = container.createDiv({ cls: 'progress-card today-card' });
        todayCard.createEl('h2', { text: "Today's Progress" });
        
        const todayStats = todayCard.createDiv({ cls: 'today-stats' });
        
        const timeProgress = (todayTime / this.plugin.settings.dailyGoalMinutes) * 100;
        const timeProgressBar = todayStats.createDiv({ cls: 'progress-bar-container' });
        timeProgressBar.createEl('div', { 
            cls: 'progress-bar-fill',
            attr: { style: `width: ${Math.min(100, timeProgress)}%` }
        });
        
        todayStats.createEl('p', { 
            text: `${todayTime} / ${this.plugin.settings.dailyGoalMinutes} minutes`,
            cls: 'progress-text'
        });

        if (timeProgress >= 100) {
            todayStats.createEl('p', { text: '🎉 Daily goal achieved!', cls: 'goal-achieved' });
        }

        // Weekly Overview
        const weeklyCard = container.createDiv({ cls: 'progress-card weekly-card' });
        weeklyCard.createEl('h2', { text: 'This Week' });
        
        const weeklyChart = weeklyCard.createDiv({ cls: 'weekly-chart' });
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        for (let i = 0; i < 7; i++) {
            const dayData = weeklyProgress[i] || { studyTime: 0, goalMet: false };
            const dayBar = weeklyChart.createDiv({ cls: 'day-bar' });
            
            const barHeight = Math.min(100, (dayData.studyTime / this.plugin.settings.dailyGoalMinutes) * 100);
            const bar = dayBar.createDiv({ cls: 'bar' });
            bar.style.height = `${barHeight}%`;
            if (dayData.goalMet) bar.addClass('goal-met');
            
            dayBar.createEl('span', { text: days[i], cls: 'day-label' });
        }

        const weeklyStats = weeklyCard.createDiv({ cls: 'weekly-stats' });
        weeklyStats.createEl('p', { text: `Total: ${weeklyTime} minutes` });
        weeklyStats.createEl('p', { text: `Goal: ${this.plugin.settings.weeklyGoalMinutes} minutes` });

        // Lifetime Stats
        const statsCard = container.createDiv({ cls: 'progress-card stats-card' });
        statsCard.createEl('h2', { text: 'All-Time Statistics' });
        
        const statsGrid = statsCard.createDiv({ cls: 'stats-grid' });
        
        this.createStatItem(statsGrid, '⏱️', 'Total Study Time', `${progress.totalStudyTime} min`);
        this.createStatItem(statsGrid, '📝', 'Sessions Completed', String(progress.sessionsCompleted));
        this.createStatItem(statsGrid, '📚', 'Notes Created', String(progress.notesCreated));
        this.createStatItem(statsGrid, '🃏', 'Flashcards Created', String(progress.flashcardsCreated));
        this.createStatItem(statsGrid, '✅', 'Cards Reviewed', String(progress.flashcardsReviewed));
        this.createStatItem(statsGrid, '📄', 'PDFs Read', String(progress.pdfsRead));
        this.createStatItem(statsGrid, '🔍', 'OCR Scans', String(progress.ocrScansCompleted));
        this.createStatItem(statsGrid, '🔥', 'Current Streak', `${progress.streakDays} days`);

        // Achievements
        const achievementsCard = container.createDiv({ cls: 'progress-card achievements-card' });
        achievementsCard.createEl('h2', { text: '🏆 Achievements' });
        
        const achievementsGrid = achievementsCard.createDiv({ cls: 'achievements-grid' });
        
        for (const achievement of achievements) {
            const achievementItem = achievementsGrid.createDiv({ 
                cls: `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`
            });
            
            achievementItem.createEl('span', { text: achievement.unlocked ? '🏆' : '🔒', cls: 'achievement-icon' });
            achievementItem.createEl('h4', { text: achievement.name, cls: 'achievement-name' });
            achievementItem.createEl('p', { text: achievement.description, cls: 'achievement-desc' });
            
            if (!achievement.unlocked) {
                const progressBar = achievementItem.createDiv({ cls: 'achievement-progress' });
                progressBar.createDiv({ 
                    cls: 'achievement-progress-fill',
                    attr: { style: `width: ${achievement.progress}%` }
                });
            }
        }

        // Recent Sessions
        if (recentSessions.length > 0) {
            const sessionsCard = container.createDiv({ cls: 'progress-card sessions-card' });
            sessionsCard.createEl('h2', { text: '📅 Recent Sessions' });
            
            const sessionsList = sessionsCard.createDiv({ cls: 'sessions-list' });
            
            for (const session of recentSessions) {
                const sessionItem = sessionsList.createDiv({ cls: 'session-item' });
                
                const date = new Date(session.startTime);
                sessionItem.createEl('span', { 
                    text: date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    cls: 'session-date'
                });
                sessionItem.createEl('span', { 
                    text: `${session.duration} min`,
                    cls: 'session-duration'
                });
                sessionItem.createEl('span', { 
                    text: `${session.flashcardsReviewed} cards`,
                    cls: 'session-cards'
                });
            }
        }

        // Motivational Quote
        const quoteCard = container.createDiv({ cls: 'progress-card quote-card' });
        const quotes = [
            "The expert in anything was once a beginner.",
            "Small daily improvements are the key to staggering long-term results.",
            "Education is not the filling of a pail, but the lighting of a fire.",
            "The beautiful thing about learning is that no one can take it away from you.",
            "Learning is a treasure that will follow its owner everywhere.",
            "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.",
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteCard.createEl('p', { text: `"${randomQuote}"`, cls: 'quote-text' });
    }

    private createStatItem(container: HTMLElement, icon: string, label: string, value: string) {
        const item = container.createDiv({ cls: 'stat-item' });
        item.createEl('span', { text: icon, cls: 'stat-icon' });
        item.createEl('span', { text: label, cls: 'stat-label' });
        item.createEl('span', { text: value, cls: 'stat-value' });
    }

    async onClose() {
        // Cleanup
    }
}
