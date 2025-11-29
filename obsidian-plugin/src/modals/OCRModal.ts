/**
 * PYQs Study Platform - OCR Modal
 * Extract text from images and PDFs
 */

import { App, Modal, Notice, TFile } from 'obsidian';
import StudyPlatformPlugin from '../main';

export class OCRModal extends Modal {
    private plugin: StudyPlatformPlugin;
    private selectedFile: TFile | null = null;
    private selectedLanguage: string;
    private isProcessing: boolean = false;

    constructor(app: App, plugin: StudyPlatformPlugin) {
        super(app);
        this.plugin = plugin;
        this.selectedLanguage = plugin.settings.ocrLanguage;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('pyqs-modal');

        // Header
        contentEl.createEl('h2', { text: '📄 OCR - Extract Text' });
        contentEl.createEl('p', { text: 'Extract text from images and scanned PDFs', cls: 'modal-subtitle' });

        // Language selector
        const languageContainer = contentEl.createDiv({ cls: 'modal-field' });
        languageContainer.createEl('label', { text: 'Recognition Language' });
        
        const languageSelect = languageContainer.createEl('select', { cls: 'modal-select' });
        const languages = this.plugin.ocrService.getSupportedLanguages();
        
        for (const lang of languages) {
            const option = languageSelect.createEl('option', { 
                text: lang.name,
                value: lang.code
            });
            if (lang.code === this.selectedLanguage) {
                option.selected = true;
            }
        }
        
        languageSelect.onchange = () => {
            this.selectedLanguage = languageSelect.value;
        };

        // File selection
        const fileContainer = contentEl.createDiv({ cls: 'modal-field' });
        fileContainer.createEl('label', { text: 'Select File' });
        
        const fileList = this.getOCRableFiles();
        
        if (fileList.length === 0) {
            fileContainer.createEl('p', { 
                text: 'No PDF or image files found in your vault.',
                cls: 'modal-warning'
            });
        } else {
            const fileSelect = fileContainer.createEl('select', { cls: 'modal-select' });
            fileSelect.createEl('option', { text: 'Select a file...', value: '' });
            
            for (const file of fileList) {
                fileSelect.createEl('option', { 
                    text: file.path,
                    value: file.path
                });
            }
            
            fileSelect.onchange = () => {
                const filePath = fileSelect.value;
                if (filePath) {
                    this.selectedFile = this.app.vault.getAbstractFileByPath(filePath) as TFile;
                } else {
                    this.selectedFile = null;
                }
            };
        }

        // Processing status
        const statusContainer = contentEl.createDiv({ cls: 'ocr-status' });

        // Info section
        const infoSection = contentEl.createDiv({ cls: 'ocr-info' });
        infoSection.createEl('h4', { text: '💡 About OCR' });
        infoSection.createEl('p', { text: 'OCR (Optical Character Recognition) extracts text from images and scanned documents.' });
        infoSection.createEl('p', { text: 'This feature uses Tesseract.js, a free and open-source OCR engine.' });
        
        const tipsEl = infoSection.createEl('ul', { cls: 'ocr-tips' });
        tipsEl.createEl('li', { text: 'For best results, use high-quality images' });
        tipsEl.createEl('li', { text: 'Ensure text is clearly visible and well-lit' });
        tipsEl.createEl('li', { text: 'Select the correct language for your document' });
        tipsEl.createEl('li', { text: 'Processing may take a few moments' });

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'modal-buttons' });
        
        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel', cls: 'modal-btn' });
        cancelBtn.onclick = () => this.close();
        
        const processBtn = buttonContainer.createEl('button', { text: 'Extract Text', cls: 'modal-btn primary' });
        processBtn.onclick = () => this.processOCR(statusContainer);
    }

    private getOCRableFiles(): TFile[] {
        const supportedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
        return this.app.vault.getFiles().filter(f => 
            supportedExtensions.includes(f.extension.toLowerCase())
        );
    }

    private async processOCR(statusContainer: HTMLElement) {
        if (!this.selectedFile) {
            new Notice('Please select a file first');
            return;
        }

        if (this.isProcessing) {
            new Notice('OCR is already in progress');
            return;
        }

        this.isProcessing = true;
        
        // Show processing status
        statusContainer.empty();
        statusContainer.addClass('processing');
        statusContainer.createEl('p', { text: '⏳ Processing... This may take a moment.' });
        
        const progressBar = statusContainer.createDiv({ cls: 'ocr-progress-bar' });
        const progressFill = progressBar.createDiv({ cls: 'ocr-progress-fill' });
        progressFill.style.width = '0%';

        try {
            // Change language if different from current
            if (this.selectedLanguage !== this.plugin.settings.ocrLanguage) {
                await this.plugin.ocrService.changeLanguage(this.selectedLanguage);
            }

            // Simulate progress (actual progress would come from Tesseract)
            let progress = 0;
            const progressInterval = setInterval(() => {
                if (progress < 90) {
                    progress += Math.random() * 15;
                    progressFill.style.width = `${Math.min(progress, 90)}%`;
                }
            }, 500);

            // Process the file
            const result = await this.plugin.ocrService.processFile(this.selectedFile);

            clearInterval(progressInterval);
            progressFill.style.width = '100%';

            // Show result
            statusContainer.empty();
            statusContainer.removeClass('processing');
            
            statusContainer.createEl('h4', { text: '✅ OCR Complete!' });
            statusContainer.createEl('p', { text: `Confidence: ${(result.confidence * 100).toFixed(1)}%` });
            
            // Preview
            const preview = statusContainer.createDiv({ cls: 'ocr-preview' });
            preview.createEl('h5', { text: 'Preview:' });
            preview.createEl('p', { 
                text: result.text.substring(0, 500) + (result.text.length > 500 ? '...' : ''),
                cls: 'ocr-preview-text'
            });

            // Create note button
            const createNoteBtn = statusContainer.createEl('button', { 
                text: '📝 Create Note with Result', 
                cls: 'modal-btn primary' 
            });
            createNoteBtn.onclick = async () => {
                const noteName = `OCR-${this.selectedFile!.basename}-${Date.now()}.md`;
                const noteContent = `# OCR Result: ${this.selectedFile!.basename}\n\n**Source:** ${this.selectedFile!.path}\n**Confidence:** ${(result.confidence * 100).toFixed(1)}%\n**Language:** ${this.selectedLanguage}\n**Processed:** ${new Date().toLocaleString()}\n\n---\n\n${result.text}`;
                
                await this.app.vault.create(noteName, noteContent);
                await this.plugin.progressService.incrementOCRScans();
                
                new Notice('Note created with OCR result!');
                this.close();
                
                // Open the new note
                await this.app.workspace.openLinkText(noteName, '', true);
            };

            // Copy to clipboard button
            const copyBtn = statusContainer.createEl('button', { 
                text: '📋 Copy to Clipboard', 
                cls: 'modal-btn' 
            });
            copyBtn.onclick = async () => {
                await navigator.clipboard.writeText(result.text);
                new Notice('Text copied to clipboard!');
            };

        } catch (error) {
            console.error('OCR error:', error);
            
            statusContainer.empty();
            statusContainer.removeClass('processing');
            statusContainer.createEl('p', { 
                text: '❌ OCR processing failed. Please try again.',
                cls: 'ocr-error'
            });
        } finally {
            this.isProcessing = false;
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
