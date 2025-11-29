/**
 * PYQs Study Platform - Main Plugin File
 * A comprehensive self-study platform with PDF reading, annotation, OCR, flashcards, and progress tracking.
 * No ads, no banners, no pop-ups - just focused learning.
 */

import { App, Plugin, PluginManifest, WorkspaceLeaf, Notice, TFile, Menu, Editor, MarkdownView } from 'obsidian';
import { StudyPlatformSettings, DEFAULT_SETTINGS, StudyProgress, StudySession, FlashcardDeck } from './types';
import { StudyPlatformSettingTab } from './settings/SettingsTab';
import { PDFViewerView, PDF_VIEWER_VIEW_TYPE } from './views/PDFViewerView';
import { FlashcardView, FLASHCARD_VIEW_TYPE } from './views/FlashcardView';
import { ProgressView, PROGRESS_VIEW_TYPE } from './views/ProgressView';
import { PomodoroView, POMODORO_VIEW_TYPE } from './views/PomodoroView';
import { OCRService } from './services/OCRService';
import { FlashcardService } from './services/FlashcardService';
import { ProgressService } from './services/ProgressService';
import { PDFService } from './services/PDFService';
import { CreateFlashcardModal } from './modals/CreateFlashcardModal';
import { QuickNoteModal } from './modals/QuickNoteModal';
import { OCRModal } from './modals/OCRModal';

export default class StudyPlatformPlugin extends Plugin {
    settings: StudyPlatformSettings;
    ocrService: OCRService;
    flashcardService: FlashcardService;
    progressService: ProgressService;
    pdfService: PDFService;
    
    private statusBarItem: HTMLElement | null = null;
    private currentSession: StudySession | null = null;
    private sessionStartTime: Date | null = null;

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.settings = DEFAULT_SETTINGS;
        this.ocrService = new OCRService(this);
        this.flashcardService = new FlashcardService(this);
        this.progressService = new ProgressService(this);
        this.pdfService = new PDFService(this);
    }

    async onload() {
        console.log('Loading PYQs Study Platform');
        
        await this.loadSettings();
        
        // Initialize services
        await this.initializeServices();
        
        // Register views
        this.registerViews();
        
        // Add ribbon icons
        this.addRibbonIcons();
        
        // Add commands
        this.addPluginCommands();
        
        // Add status bar
        if (this.settings.showStatusBar) {
            this.addStatusBar();
        }
        
        // Add settings tab
        this.addSettingTab(new StudyPlatformSettingTab(this.app, this));
        
        // Register file menu items
        this.registerFileMenuItems();
        
        // Register editor menu items
        this.registerEditorMenuItems();
        
        // Start session if auto-start is enabled
        if (this.settings.autoStartSession) {
            this.startStudySession();
        }
        
        new Notice('PYQs Study Platform loaded');
    }

    onunload() {
        // End current session if active
        if (this.currentSession) {
            this.endStudySession();
        }
        
        console.log('Unloading PYQs Study Platform');
    }

    async initializeServices() {
        await this.flashcardService.loadDecks();
        await this.progressService.loadProgress();
    }

    registerViews() {
        // PDF Viewer
        this.registerView(
            PDF_VIEWER_VIEW_TYPE,
            (leaf) => new PDFViewerView(leaf, this)
        );
        
        // Flashcard View
        this.registerView(
            FLASHCARD_VIEW_TYPE,
            (leaf) => new FlashcardView(leaf, this)
        );
        
        // Progress View
        this.registerView(
            PROGRESS_VIEW_TYPE,
            (leaf) => new ProgressView(leaf, this)
        );
        
        // Pomodoro View
        this.registerView(
            POMODORO_VIEW_TYPE,
            (leaf) => new PomodoroView(leaf, this)
        );
    }

    addRibbonIcons() {
        // PDF Viewer
        this.addRibbonIcon('file-text', 'Open PDF Viewer', () => {
            this.activateView(PDF_VIEWER_VIEW_TYPE);
        });
        
        // Flashcards
        this.addRibbonIcon('layers', 'Study Flashcards', () => {
            this.activateView(FLASHCARD_VIEW_TYPE);
        });
        
        // Progress
        this.addRibbonIcon('bar-chart-2', 'View Progress', () => {
            this.activateView(PROGRESS_VIEW_TYPE);
        });
        
        // Pomodoro Timer
        this.addRibbonIcon('clock', 'Pomodoro Timer', () => {
            this.activateView(POMODORO_VIEW_TYPE);
        });
    }

    addPluginCommands() {
        // PDF Commands
        this.addCommand({
            id: 'open-pdf-viewer',
            name: 'Open PDF Viewer',
            callback: () => this.activateView(PDF_VIEWER_VIEW_TYPE),
        });
        
        this.addCommand({
            id: 'run-ocr-on-pdf',
            name: 'Run OCR on PDF',
            callback: () => new OCRModal(this.app, this).open(),
        });
        
        // Flashcard Commands
        this.addCommand({
            id: 'study-flashcards',
            name: 'Study Flashcards',
            callback: () => this.activateView(FLASHCARD_VIEW_TYPE),
        });
        
        this.addCommand({
            id: 'create-flashcard',
            name: 'Create New Flashcard',
            callback: () => new CreateFlashcardModal(this.app, this).open(),
        });
        
        this.addCommand({
            id: 'create-flashcard-from-selection',
            name: 'Create Flashcard from Selection',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                const selection = editor.getSelection();
                if (selection) {
                    new CreateFlashcardModal(this.app, this, selection).open();
                } else {
                    new Notice('Please select some text first');
                }
            },
        });
        
        // Progress Commands
        this.addCommand({
            id: 'view-progress',
            name: 'View Study Progress',
            callback: () => this.activateView(PROGRESS_VIEW_TYPE),
        });
        
        // Pomodoro Commands
        this.addCommand({
            id: 'start-pomodoro',
            name: 'Start Pomodoro Timer',
            callback: () => this.activateView(POMODORO_VIEW_TYPE),
        });
        
        // Session Commands
        this.addCommand({
            id: 'start-study-session',
            name: 'Start Study Session',
            callback: () => this.startStudySession(),
        });
        
        this.addCommand({
            id: 'end-study-session',
            name: 'End Study Session',
            callback: () => this.endStudySession(),
        });
        
        // Quick Note
        this.addCommand({
            id: 'quick-note',
            name: 'Create Quick Note',
            callback: () => new QuickNoteModal(this.app, this).open(),
        });
    }

    addStatusBar() {
        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar();
    }

    updateStatusBar() {
        if (!this.statusBarItem) return;
        
        const progress = this.progressService.getProgress();
        const todayMinutes = this.progressService.getTodayStudyTime();
        const sessionActive = this.currentSession !== null;
        
        let statusText = '';
        if (sessionActive) {
            const elapsed = Math.floor((Date.now() - (this.sessionStartTime?.getTime() || 0)) / 60000);
            statusText = `📚 Studying: ${elapsed}m`;
        } else {
            statusText = `📊 Today: ${todayMinutes}m / ${this.settings.dailyGoalMinutes}m`;
        }
        
        this.statusBarItem.setText(statusText);
    }

    registerFileMenuItems() {
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu: Menu, file: TFile) => {
                if (file.extension === 'pdf') {
                    menu.addItem((item) => {
                        item.setTitle('Open with PDF Viewer')
                            .setIcon('file-text')
                            .onClick(() => {
                                this.openPDFInViewer(file);
                            });
                    });
                    
                    menu.addItem((item) => {
                        item.setTitle('Extract Text (OCR)')
                            .setIcon('scan')
                            .onClick(async () => {
                                await this.runOCROnFile(file);
                            });
                    });
                }
            })
        );
    }

    registerEditorMenuItems() {
        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
                const selection = editor.getSelection();
                if (selection) {
                    menu.addItem((item) => {
                        item.setTitle('Create Flashcard')
                            .setIcon('layers')
                            .onClick(() => {
                                new CreateFlashcardModal(this.app, this, selection).open();
                            });
                    });
                }
            })
        );
    }

    async activateView(viewType: string) {
        const { workspace } = this.app;
        
        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(viewType);
        
        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: viewType, active: true });
            }
        }
        
        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async openPDFInViewer(file: TFile) {
        await this.activateView(PDF_VIEWER_VIEW_TYPE);
        // The PDF service will handle loading the file
        await this.pdfService.openPDF(file);
    }

    async runOCROnFile(file: TFile) {
        try {
            new Notice('Starting OCR processing...');
            const result = await this.ocrService.processFile(file);
            
            // Create a new note with the OCR result
            const noteName = `OCR-${file.basename}-${Date.now()}.md`;
            const noteContent = `# OCR Result: ${file.basename}\n\n**Confidence:** ${(result.confidence * 100).toFixed(1)}%\n**Processed:** ${new Date().toLocaleString()}\n\n---\n\n${result.text}`;
            
            await this.app.vault.create(noteName, noteContent);
            new Notice('OCR completed! Note created.');
            
            // Update progress
            this.progressService.incrementOCRScans();
        } catch (error) {
            console.error('OCR error:', error);
            new Notice('OCR processing failed. Please try again.');
        }
    }

    startStudySession() {
        if (this.currentSession) {
            new Notice('Study session already active');
            return;
        }
        
        this.sessionStartTime = new Date();
        this.currentSession = {
            id: `session-${Date.now()}`,
            startTime: this.sessionStartTime,
            duration: 0,
            topicsCovered: [],
            notesCreated: 0,
            flashcardsReviewed: 0,
        };
        
        new Notice('Study session started!');
        this.updateStatusBar();
        
        // Update status bar every minute
        this.registerInterval(
            window.setInterval(() => this.updateStatusBar(), 60000)
        );
    }

    endStudySession() {
        if (!this.currentSession || !this.sessionStartTime) {
            new Notice('No active study session');
            return;
        }
        
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - this.sessionStartTime.getTime()) / 60000);
        
        this.currentSession.endTime = endTime;
        this.currentSession.duration = duration;
        
        // Save session to progress
        this.progressService.addSession(this.currentSession);
        
        new Notice(`Study session ended. Duration: ${duration} minutes`);
        
        this.currentSession = null;
        this.sessionStartTime = null;
        this.updateStatusBar();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
