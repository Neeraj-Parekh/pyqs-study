/**
 * PYQs Study Platform - Pomodoro Timer View
 * Focus timer for productive study sessions
 */

import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import StudyPlatformPlugin from '../main';
import { PomodoroSession } from '../types';

export const POMODORO_VIEW_TYPE = 'pyqs-pomodoro-view';

export class PomodoroView extends ItemView {
    private plugin: StudyPlatformPlugin;
    private timerInterval: number | null = null;
    private currentSession: PomodoroSession | null = null;
    private remainingTime: number = 0;
    private isRunning: boolean = false;
    private pomodorosCompleted: number = 0;

    constructor(leaf: WorkspaceLeaf, plugin: StudyPlatformPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return POMODORO_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'Pomodoro Timer';
    }

    getIcon(): string {
        return 'clock';
    }

    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        container.addClass('pyqs-pomodoro-view');

        this.renderView(container);
    }

    private renderView(container: HTMLElement) {
        container.empty();

        const settings = this.plugin.settings.pomodoro;

        // Header
        const header = container.createDiv({ cls: 'pomodoro-header' });
        header.createEl('h1', { text: '🍅 Pomodoro Timer' });
        header.createEl('p', { text: 'Stay focused, take breaks, study better', cls: 'pomodoro-subtitle' });

        // Timer display
        const timerDisplay = container.createDiv({ cls: 'timer-display' });
        
        const timerCircle = timerDisplay.createDiv({ cls: 'timer-circle' });
        
        const timeText = timerCircle.createDiv({ cls: 'time-text' });
        timeText.textContent = this.formatTime(this.remainingTime || settings.workDuration * 60);
        
        const sessionType = timerCircle.createDiv({ cls: 'session-type' });
        sessionType.textContent = this.currentSession?.type === 'work' ? 'Work' : 
                                  this.currentSession?.type === 'shortBreak' ? 'Short Break' :
                                  this.currentSession?.type === 'longBreak' ? 'Long Break' : 'Ready';

        // Progress indicators
        const progressIndicators = container.createDiv({ cls: 'progress-indicators' });
        for (let i = 0; i < settings.longBreakInterval; i++) {
            const dot = progressIndicators.createDiv({ 
                cls: `progress-dot ${i < this.pomodorosCompleted % settings.longBreakInterval ? 'completed' : ''}`
            });
        }
        progressIndicators.createEl('span', { 
            text: `${this.pomodorosCompleted} pomodoros completed`,
            cls: 'pomodoro-count'
        });

        // Control buttons
        const controls = container.createDiv({ cls: 'timer-controls' });
        
        if (!this.isRunning && !this.currentSession) {
            // Start buttons
            const startWorkBtn = controls.createEl('button', { text: '▶ Start Work', cls: 'control-btn primary' });
            startWorkBtn.onclick = () => this.startTimer('work');
            
            const startBreakBtn = controls.createEl('button', { text: '☕ Take Break', cls: 'control-btn' });
            startBreakBtn.onclick = () => this.startTimer('shortBreak');
        } else if (this.isRunning) {
            // Pause button
            const pauseBtn = controls.createEl('button', { text: '⏸ Pause', cls: 'control-btn warning' });
            pauseBtn.onclick = () => this.pauseTimer();
        } else {
            // Resume and reset buttons
            const resumeBtn = controls.createEl('button', { text: '▶ Resume', cls: 'control-btn primary' });
            resumeBtn.onclick = () => this.resumeTimer();
            
            const resetBtn = controls.createEl('button', { text: '↻ Reset', cls: 'control-btn danger' });
            resetBtn.onclick = () => this.resetTimer();
        }

        const skipBtn = controls.createEl('button', { text: '⏭ Skip', cls: 'control-btn' });
        skipBtn.onclick = () => this.skipSession();

        // Quick presets
        const presets = container.createDiv({ cls: 'timer-presets' });
        presets.createEl('h3', { text: 'Quick Start' });
        
        const presetGrid = presets.createDiv({ cls: 'preset-grid' });
        
        const preset25 = presetGrid.createEl('button', { text: '25 min', cls: 'preset-btn' });
        preset25.onclick = () => this.startCustomTimer(25);
        
        const preset45 = presetGrid.createEl('button', { text: '45 min', cls: 'preset-btn' });
        preset45.onclick = () => this.startCustomTimer(45);
        
        const preset60 = presetGrid.createEl('button', { text: '60 min', cls: 'preset-btn' });
        preset60.onclick = () => this.startCustomTimer(60);
        
        const preset90 = presetGrid.createEl('button', { text: '90 min', cls: 'preset-btn' });
        preset90.onclick = () => this.startCustomTimer(90);

        // Custom timer
        const customTimer = container.createDiv({ cls: 'custom-timer' });
        customTimer.createEl('h3', { text: 'Custom Duration' });
        
        const customInput = customTimer.createEl('input', { 
            type: 'number',
            cls: 'custom-input',
            attr: { placeholder: 'Minutes', min: '1', max: '180' }
        });
        
        const customBtn = customTimer.createEl('button', { text: 'Start Custom', cls: 'control-btn' });
        customBtn.onclick = () => {
            const minutes = parseInt((customInput as HTMLInputElement).value);
            if (minutes > 0 && minutes <= 180) {
                this.startCustomTimer(minutes);
            } else {
                new Notice('Please enter a valid duration (1-180 minutes)');
            }
        };

        // Tips section
        const tips = container.createDiv({ cls: 'pomodoro-tips' });
        tips.createEl('h3', { text: '💡 Pomodoro Tips' });
        
        const tipsList = tips.createEl('ul', { cls: 'tips-list' });
        tipsList.createEl('li', { text: 'Work in focused 25-minute blocks' });
        tipsList.createEl('li', { text: 'Take short 5-minute breaks between sessions' });
        tipsList.createEl('li', { text: 'After 4 pomodoros, take a longer 15-30 minute break' });
        tipsList.createEl('li', { text: 'During breaks, step away from your desk' });
        tipsList.createEl('li', { text: 'Stay hydrated and stretch during breaks' });
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    private startTimer(type: 'work' | 'shortBreak' | 'longBreak') {
        const settings = this.plugin.settings.pomodoro;
        
        let duration: number;
        switch (type) {
            case 'work':
                duration = settings.workDuration;
                break;
            case 'shortBreak':
                duration = settings.shortBreakDuration;
                break;
            case 'longBreak':
                duration = settings.longBreakDuration;
                break;
        }

        this.currentSession = {
            id: `pomodoro-${Date.now()}`,
            type,
            duration,
            startTime: new Date(),
            completed: false,
        };

        this.remainingTime = duration * 60;
        this.isRunning = true;
        this.startInterval();
        this.renderView(this.containerEl.children[1] as HTMLElement);
    }

    private startCustomTimer(minutes: number) {
        this.currentSession = {
            id: `pomodoro-${Date.now()}`,
            type: 'work',
            duration: minutes,
            startTime: new Date(),
            completed: false,
        };

        this.remainingTime = minutes * 60;
        this.isRunning = true;
        this.startInterval();
        this.renderView(this.containerEl.children[1] as HTMLElement);
    }

    private startInterval() {
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
        }

        this.timerInterval = window.setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
                this.updateTimerDisplay();
            } else {
                this.completeSession();
            }
        }, 1000);
    }

    private updateTimerDisplay() {
        const timeText = this.containerEl.querySelector('.time-text');
        if (timeText) {
            timeText.textContent = this.formatTime(this.remainingTime);
        }
    }

    private pauseTimer() {
        this.isRunning = false;
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.renderView(this.containerEl.children[1] as HTMLElement);
    }

    private resumeTimer() {
        this.isRunning = true;
        this.startInterval();
        this.renderView(this.containerEl.children[1] as HTMLElement);
    }

    private resetTimer() {
        this.isRunning = false;
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.currentSession = null;
        this.remainingTime = 0;
        this.renderView(this.containerEl.children[1] as HTMLElement);
    }

    private skipSession() {
        this.completeSession(true);
    }

    private async completeSession(skipped: boolean = false) {
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        const session = this.currentSession;
        
        if (session && !skipped) {
            session.endTime = new Date();
            session.completed = true;

            if (session.type === 'work') {
                this.pomodorosCompleted++;
                
                // Add study time to progress
                await this.plugin.progressService.addStudyTime(session.duration);
                
                if (this.plugin.settings.enableNotifications) {
                    new Notice('🍅 Pomodoro completed! Time for a break.');
                }

                // Auto-start break if enabled
                if (this.plugin.settings.pomodoro.autoStartBreaks) {
                    const breakType = this.pomodorosCompleted % this.plugin.settings.pomodoro.longBreakInterval === 0
                        ? 'longBreak'
                        : 'shortBreak';
                    this.currentSession = null;
                    this.remainingTime = 0;
                    this.isRunning = false;
                    
                    setTimeout(() => this.startTimer(breakType), 1000);
                    return;
                }
            } else {
                if (this.plugin.settings.enableNotifications) {
                    new Notice('☕ Break over! Ready to focus?');
                }

                // Auto-start work if enabled
                if (this.plugin.settings.pomodoro.autoStartPomodoros) {
                    this.currentSession = null;
                    this.remainingTime = 0;
                    this.isRunning = false;
                    
                    setTimeout(() => this.startTimer('work'), 1000);
                    return;
                }
            }
        }

        this.isRunning = false;
        this.currentSession = null;
        this.remainingTime = 0;
        this.renderView(this.containerEl.children[1] as HTMLElement);
    }

    async onClose() {
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
        }
    }
}
