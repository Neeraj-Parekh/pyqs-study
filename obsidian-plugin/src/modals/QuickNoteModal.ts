/**
 * PYQs Study Platform - Quick Note Modal
 * Fast note creation for capturing ideas
 */

import { App, Modal, Notice, TFolder } from 'obsidian';
import StudyPlatformPlugin from '../main';

export class QuickNoteModal extends Modal {
    private plugin: StudyPlatformPlugin;
    private title: string = '';
    private content: string = '';
    private folder: string = '';
    private tags: string = '';

    constructor(app: App, plugin: StudyPlatformPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('pyqs-modal');

        // Header
        contentEl.createEl('h2', { text: '📝 Quick Note' });
        contentEl.createEl('p', { text: 'Capture your thoughts quickly', cls: 'modal-subtitle' });

        // Title input
        const titleContainer = contentEl.createDiv({ cls: 'modal-field' });
        titleContainer.createEl('label', { text: 'Title' });
        const titleInput = titleContainer.createEl('input', { 
            type: 'text',
            cls: 'modal-input',
            attr: { placeholder: 'Note title...' }
        });
        titleInput.oninput = () => {
            this.title = titleInput.value;
        };

        // Content textarea
        const contentContainer = contentEl.createDiv({ cls: 'modal-field' });
        contentContainer.createEl('label', { text: 'Content' });
        const contentInput = contentContainer.createEl('textarea', { 
            cls: 'modal-textarea',
            attr: { placeholder: 'Start writing...', rows: '8' }
        });
        contentInput.oninput = () => {
            this.content = (contentInput as HTMLTextAreaElement).value;
        };

        // Folder selector
        const folderContainer = contentEl.createDiv({ cls: 'modal-field' });
        folderContainer.createEl('label', { text: 'Folder (optional)' });
        const folderInput = folderContainer.createEl('input', { 
            type: 'text',
            cls: 'modal-input',
            attr: { placeholder: 'e.g., Notes/Study' }
        });
        folderInput.oninput = () => {
            this.folder = folderInput.value;
        };

        // Tags input
        const tagsContainer = contentEl.createDiv({ cls: 'modal-field' });
        tagsContainer.createEl('label', { text: 'Tags (optional)' });
        const tagsInput = tagsContainer.createEl('input', { 
            type: 'text',
            cls: 'modal-input',
            attr: { placeholder: 'e.g., study, important, review' }
        });
        tagsInput.oninput = () => {
            this.tags = tagsInput.value;
        };

        // Templates
        const templatesContainer = contentEl.createDiv({ cls: 'templates-container' });
        templatesContainer.createEl('h4', { text: 'Quick Templates' });
        
        const templatesGrid = templatesContainer.createDiv({ cls: 'templates-grid' });
        
        const lectureTemplate = templatesGrid.createEl('button', { text: '📚 Lecture Notes', cls: 'template-btn' });
        lectureTemplate.onclick = () => this.applyTemplate('lecture');
        
        const meetingTemplate = templatesGrid.createEl('button', { text: '📋 Meeting Notes', cls: 'template-btn' });
        meetingTemplate.onclick = () => this.applyTemplate('meeting');
        
        const ideaTemplate = templatesGrid.createEl('button', { text: '💡 Idea', cls: 'template-btn' });
        ideaTemplate.onclick = () => this.applyTemplate('idea');
        
        const todoTemplate = templatesGrid.createEl('button', { text: '✅ To-Do List', cls: 'template-btn' });
        todoTemplate.onclick = () => this.applyTemplate('todo');

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'modal-buttons' });
        
        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel', cls: 'modal-btn' });
        cancelBtn.onclick = () => this.close();
        
        const createBtn = buttonContainer.createEl('button', { text: 'Create Note', cls: 'modal-btn primary' });
        createBtn.onclick = () => this.createNote();
    }

    applyTemplate(type: string) {
        const titleInput = this.contentEl.querySelector('input') as HTMLInputElement;
        const contentInput = this.contentEl.querySelector('textarea') as HTMLTextAreaElement;
        
        const date = new Date().toLocaleDateString();
        
        switch (type) {
            case 'lecture':
                titleInput.value = `Lecture Notes - ${date}`;
                contentInput.value = `# Lecture Notes\n\n**Date:** ${date}\n**Subject:** \n**Topic:** \n\n## Key Points\n\n- \n- \n- \n\n## Summary\n\n\n\n## Questions\n\n- \n\n## Action Items\n\n- [ ] `;
                break;
            case 'meeting':
                titleInput.value = `Meeting Notes - ${date}`;
                contentInput.value = `# Meeting Notes\n\n**Date:** ${date}\n**Attendees:** \n**Topic:** \n\n## Agenda\n\n1. \n2. \n3. \n\n## Discussion\n\n\n\n## Decisions\n\n- \n\n## Action Items\n\n- [ ] `;
                break;
            case 'idea':
                titleInput.value = `Idea - ${date}`;
                contentInput.value = `# 💡 Idea\n\n**Date:** ${date}\n\n## Description\n\n\n\n## Why it matters\n\n\n\n## Next steps\n\n- [ ] `;
                break;
            case 'todo':
                titleInput.value = `To-Do - ${date}`;
                contentInput.value = `# ✅ To-Do List\n\n**Date:** ${date}\n\n## High Priority\n\n- [ ] \n\n## Medium Priority\n\n- [ ] \n\n## Low Priority\n\n- [ ] \n\n## Notes\n\n`;
                break;
        }
        
        this.title = titleInput.value;
        this.content = contentInput.value;
    }

    async createNote() {
        if (!this.title.trim()) {
            new Notice('Please enter a title');
            return;
        }

        try {
            // Prepare content with tags
            let noteContent = this.content;
            if (this.tags.trim()) {
                const tagsList = this.tags.split(',').map(t => `#${t.trim()}`).join(' ');
                noteContent = `${tagsList}\n\n${noteContent}`;
            }

            // Determine file path
            let filePath = `${this.title.trim()}.md`;
            if (this.folder.trim()) {
                // Ensure folder exists
                const folderPath = this.folder.trim();
                const folder = this.app.vault.getAbstractFileByPath(folderPath);
                
                if (!folder) {
                    await this.app.vault.createFolder(folderPath);
                }
                
                filePath = `${folderPath}/${this.title.trim()}.md`;
            }

            // Check if file already exists
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile) {
                new Notice('A note with this name already exists');
                return;
            }

            // Create the note
            await this.app.vault.create(filePath, noteContent);
            
            // Update progress
            await this.plugin.progressService.incrementNotesCreated();
            
            new Notice('Note created!');
            this.close();

            // Open the new note
            const newFile = this.app.vault.getAbstractFileByPath(filePath);
            if (newFile) {
                await this.app.workspace.openLinkText(filePath, '', true);
            }
        } catch (error) {
            console.error('Failed to create note:', error);
            new Notice('Failed to create note. Please try again.');
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
