/**
 * PYQs Study Platform - Create Flashcard Modal
 * Quick flashcard creation without distractions
 */

import { App, Modal, Notice, Setting } from 'obsidian';
import StudyPlatformPlugin from '../main';

export class CreateFlashcardModal extends Modal {
    private plugin: StudyPlatformPlugin;
    private front: string = '';
    private back: string = '';
    private selectedDeck: string = '';
    private tags: string = '';
    private initialText: string;

    constructor(app: App, plugin: StudyPlatformPlugin, initialText: string = '') {
        super(app);
        this.plugin = plugin;
        this.initialText = initialText;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('pyqs-modal');

        // Header
        contentEl.createEl('h2', { text: '📝 Create Flashcard' });

        // Deck selector
        const decks = this.plugin.flashcardService.getDecks();
        
        if (decks.length === 0) {
            contentEl.createEl('p', { 
                text: 'No decks found. Create a deck first.',
                cls: 'modal-warning'
            });
            
            const createDeckBtn = contentEl.createEl('button', { text: 'Create Deck', cls: 'modal-btn primary' });
            createDeckBtn.onclick = async () => {
                const name = window.prompt('Deck name:');
                if (name) {
                    await this.plugin.flashcardService.createDeck(name);
                    this.onOpen(); // Refresh
                }
            };
            return;
        }

        new Setting(contentEl)
            .setName('Deck')
            .setDesc('Select the deck for this card')
            .addDropdown(dropdown => {
                for (const deck of decks) {
                    dropdown.addOption(deck.id, deck.name);
                }
                this.selectedDeck = decks[0].id;
                dropdown.onChange(value => {
                    this.selectedDeck = value;
                });
            });

        // Front (Question)
        new Setting(contentEl)
            .setName('Front (Question)')
            .setDesc('What you want to remember')
            .addTextArea(text => {
                text.setValue(this.initialText)
                    .setPlaceholder('Enter the question or term...')
                    .onChange(value => {
                        this.front = value;
                    });
                text.inputEl.rows = 3;
                text.inputEl.addClass('modal-textarea');
                this.front = this.initialText;
            });

        // Back (Answer)
        new Setting(contentEl)
            .setName('Back (Answer)')
            .setDesc('The answer or definition')
            .addTextArea(text => {
                text.setPlaceholder('Enter the answer or definition...')
                    .onChange(value => {
                        this.back = value;
                    });
                text.inputEl.rows = 4;
                text.inputEl.addClass('modal-textarea');
            });

        // Tags
        new Setting(contentEl)
            .setName('Tags')
            .setDesc('Optional: Add tags separated by commas')
            .addText(text => {
                text.setPlaceholder('e.g., math, algebra, important')
                    .onChange(value => {
                        this.tags = value;
                    });
            });

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'modal-buttons' });
        
        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel', cls: 'modal-btn' });
        cancelBtn.onclick = () => this.close();
        
        const createBtn = buttonContainer.createEl('button', { text: 'Create Card', cls: 'modal-btn primary' });
        createBtn.onclick = () => this.createCard();

        // Quick create tip
        contentEl.createEl('p', { 
            text: '💡 Tip: Select text in a note and use the context menu to quickly create flashcards.',
            cls: 'modal-tip'
        });
    }

    async createCard() {
        if (!this.front.trim()) {
            new Notice('Please enter the front (question) of the card');
            return;
        }
        
        if (!this.back.trim()) {
            new Notice('Please enter the back (answer) of the card');
            return;
        }

        const tags = this.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

        try {
            await this.plugin.flashcardService.createCard(
                this.selectedDeck,
                this.front.trim(),
                this.back.trim(),
                tags
            );
            
            await this.plugin.progressService.incrementFlashcardsCreated();
            new Notice('Flashcard created!');
            this.close();
        } catch (error) {
            console.error('Failed to create flashcard:', error);
            new Notice('Failed to create flashcard. Please try again.');
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
