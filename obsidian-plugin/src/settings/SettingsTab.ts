/**
 * PYQs Study Platform - Settings Tab
 * Clean settings panel with no ads, banners, or pop-ups
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import StudyPlatformPlugin from '../main';

export class StudyPlatformSettingTab extends PluginSettingTab {
    plugin: StudyPlatformPlugin;

    constructor(app: App, plugin: StudyPlatformPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Header
        containerEl.createEl('h1', { text: 'PYQs Study Platform' });
        containerEl.createEl('p', { 
            text: 'Your focused study companion. No distractions, just learning.',
            cls: 'setting-item-description'
        });

        // General Settings
        containerEl.createEl('h2', { text: 'General Settings' });
        
        new Setting(containerEl)
            .setName('Show status bar')
            .setDesc('Display study progress in the status bar')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showStatusBar)
                .onChange(async (value) => {
                    this.plugin.settings.showStatusBar = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable notifications')
            .setDesc('Show notifications for study reminders and achievements')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableNotifications)
                .onChange(async (value) => {
                    this.plugin.settings.enableNotifications = value;
                    await this.plugin.saveSettings();
                }));

        // PDF Settings
        containerEl.createEl('h2', { text: 'PDF Viewer Settings' });

        new Setting(containerEl)
            .setName('Default zoom level')
            .setDesc('Default zoom percentage for PDF viewer')
            .addSlider(slider => slider
                .setLimits(50, 200, 10)
                .setValue(this.plugin.settings.defaultPDFZoom)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.defaultPDFZoom = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Annotation color')
            .setDesc('Default highlight color for PDF annotations')
            .addColorPicker(picker => picker
                .setValue(this.plugin.settings.pdfAnnotationColor)
                .onChange(async (value) => {
                    this.plugin.settings.pdfAnnotationColor = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto-save annotations')
            .setDesc('Automatically save PDF annotations')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoSaveAnnotations)
                .onChange(async (value) => {
                    this.plugin.settings.autoSaveAnnotations = value;
                    await this.plugin.saveSettings();
                }));

        // OCR Settings
        containerEl.createEl('h2', { text: 'OCR Settings' });

        new Setting(containerEl)
            .setName('OCR language')
            .setDesc('Language for text recognition (uses Tesseract.js)')
            .addDropdown(dropdown => dropdown
                .addOption('eng', 'English')
                .addOption('fra', 'French')
                .addOption('deu', 'German')
                .addOption('spa', 'Spanish')
                .addOption('ita', 'Italian')
                .addOption('por', 'Portuguese')
                .addOption('rus', 'Russian')
                .addOption('chi_sim', 'Chinese (Simplified)')
                .addOption('chi_tra', 'Chinese (Traditional)')
                .addOption('jpn', 'Japanese')
                .addOption('kor', 'Korean')
                .addOption('ara', 'Arabic')
                .addOption('hin', 'Hindi')
                .setValue(this.plugin.settings.ocrLanguage)
                .onChange(async (value) => {
                    this.plugin.settings.ocrLanguage = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto-process PDFs')
            .setDesc('Automatically run OCR when opening scanned PDFs')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.ocrAutoProcess)
                .onChange(async (value) => {
                    this.plugin.settings.ocrAutoProcess = value;
                    await this.plugin.saveSettings();
                }));

        // Flashcard Settings
        containerEl.createEl('h2', { text: 'Flashcard Settings' });

        new Setting(containerEl)
            .setName('New cards per day')
            .setDesc('Maximum number of new cards to study each day')
            .addSlider(slider => slider
                .setLimits(1, 100, 1)
                .setValue(this.plugin.settings.newCardsPerDay)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.newCardsPerDay = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Review cards per day')
            .setDesc('Maximum number of review cards per day')
            .addSlider(slider => slider
                .setLimits(10, 500, 10)
                .setValue(this.plugin.settings.reviewCardsPerDay)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.reviewCardsPerDay = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Ease bonus')
            .setDesc('Bonus multiplier for easy cards (1.0 - 2.0)')
            .addSlider(slider => slider
                .setLimits(1.0, 2.0, 0.1)
                .setValue(this.plugin.settings.easeBonus)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.easeBonus = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Interval modifier')
            .setDesc('Multiplier for review intervals (0.5 - 2.0)')
            .addSlider(slider => slider
                .setLimits(0.5, 2.0, 0.1)
                .setValue(this.plugin.settings.intervalModifier)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.intervalModifier = value;
                    await this.plugin.saveSettings();
                }));

        // Pomodoro Settings
        containerEl.createEl('h2', { text: 'Pomodoro Timer Settings' });

        new Setting(containerEl)
            .setName('Work duration')
            .setDesc('Length of work sessions in minutes')
            .addSlider(slider => slider
                .setLimits(15, 60, 5)
                .setValue(this.plugin.settings.pomodoro.workDuration)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.pomodoro.workDuration = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Short break duration')
            .setDesc('Length of short breaks in minutes')
            .addSlider(slider => slider
                .setLimits(3, 15, 1)
                .setValue(this.plugin.settings.pomodoro.shortBreakDuration)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.pomodoro.shortBreakDuration = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Long break duration')
            .setDesc('Length of long breaks in minutes')
            .addSlider(slider => slider
                .setLimits(10, 30, 5)
                .setValue(this.plugin.settings.pomodoro.longBreakDuration)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.pomodoro.longBreakDuration = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Long break interval')
            .setDesc('Number of work sessions before a long break')
            .addSlider(slider => slider
                .setLimits(2, 8, 1)
                .setValue(this.plugin.settings.pomodoro.longBreakInterval)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.pomodoro.longBreakInterval = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto-start breaks')
            .setDesc('Automatically start breaks after work sessions')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.pomodoro.autoStartBreaks)
                .onChange(async (value) => {
                    this.plugin.settings.pomodoro.autoStartBreaks = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto-start work sessions')
            .setDesc('Automatically start work sessions after breaks')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.pomodoro.autoStartPomodoros)
                .onChange(async (value) => {
                    this.plugin.settings.pomodoro.autoStartPomodoros = value;
                    await this.plugin.saveSettings();
                }));

        // Progress Tracking Settings
        containerEl.createEl('h2', { text: 'Progress Tracking' });

        new Setting(containerEl)
            .setName('Daily study goal')
            .setDesc('Target study time per day in minutes')
            .addSlider(slider => slider
                .setLimits(15, 240, 15)
                .setValue(this.plugin.settings.dailyGoalMinutes)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.dailyGoalMinutes = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Weekly study goal')
            .setDesc('Target study time per week in minutes')
            .addSlider(slider => slider
                .setLimits(60, 1680, 60)
                .setValue(this.plugin.settings.weeklyGoalMinutes)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.weeklyGoalMinutes = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show progress in status bar')
            .setDesc('Display today\'s progress in the status bar')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showProgressInStatusBar)
                .onChange(async (value) => {
                    this.plugin.settings.showProgressInStatusBar = value;
                    await this.plugin.saveSettings();
                }));

        // Study Session Settings
        containerEl.createEl('h2', { text: 'Study Session' });

        new Setting(containerEl)
            .setName('Auto-start session')
            .setDesc('Automatically start a study session when Obsidian opens')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoStartSession)
                .onChange(async (value) => {
                    this.plugin.settings.autoStartSession = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Session reminder interval')
            .setDesc('Reminder interval during active sessions (minutes, 0 to disable)')
            .addSlider(slider => slider
                .setLimits(0, 60, 5)
                .setValue(this.plugin.settings.sessionReminderInterval)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.sessionReminderInterval = value;
                    await this.plugin.saveSettings();
                }));

        // Footer
        containerEl.createEl('hr');
        const footer = containerEl.createEl('div', { cls: 'study-platform-footer' });
        footer.createEl('p', { 
            text: 'PYQs Study Platform v1.0.0',
            cls: 'setting-item-description'
        });
        footer.createEl('p', { 
            text: 'A focused learning tool. No ads. No tracking. No distractions.',
            cls: 'setting-item-description'
        });
    }
}
