/**
 * PYQs Study Platform - Flashcard View
 * Study flashcards with spaced repetition
 */

import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import StudyPlatformPlugin from '../main';
import { Flashcard, FlashcardDeck } from '../types';

export const FLASHCARD_VIEW_TYPE = 'pyqs-flashcard-view';

export class FlashcardView extends ItemView {
    private plugin: StudyPlatformPlugin;
    private currentCards: Flashcard[] = [];
    private currentIndex: number = 0;
    private isFlipped: boolean = false;
    private currentDeck: string | null = null;
    private studyMode: 'review' | 'new' | 'all' = 'review';

    constructor(leaf: WorkspaceLeaf, plugin: StudyPlatformPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return FLASHCARD_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'Flashcards';
    }

    getIcon(): string {
        return 'layers';
    }

    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        container.addClass('pyqs-flashcard-view');

        this.renderView(container);
    }

    private renderView(container: HTMLElement) {
        container.empty();

        // Header
        const header = container.createDiv({ cls: 'flashcard-header' });
        header.createEl('h2', { text: '📚 Flashcards' });

        // Stats
        const stats = this.plugin.flashcardService.getStats();
        const statsDiv = header.createDiv({ cls: 'flashcard-stats' });
        statsDiv.createEl('span', { text: `${stats.totalDecks} decks`, cls: 'stat-item' });
        statsDiv.createEl('span', { text: `${stats.totalCards} cards`, cls: 'stat-item' });
        statsDiv.createEl('span', { text: `${stats.reviewCards} due`, cls: 'stat-item due' });
        statsDiv.createEl('span', { text: `${stats.newCards} new`, cls: 'stat-item new' });

        // Mode selector
        const modeSelector = container.createDiv({ cls: 'flashcard-mode-selector' });
        this.createModeButton(modeSelector, 'Review Due', 'review');
        this.createModeButton(modeSelector, 'New Cards', 'new');
        this.createModeButton(modeSelector, 'All Cards', 'all');

        // Deck selector
        const deckSelector = container.createDiv({ cls: 'flashcard-deck-selector' });
        const decks = this.plugin.flashcardService.getDecks();
        
        const allDecksBtn = deckSelector.createEl('button', { 
            text: 'All Decks', 
            cls: `deck-btn ${!this.currentDeck ? 'active' : ''}` 
        });
        allDecksBtn.onclick = () => this.selectDeck(null);

        for (const deck of decks) {
            const deckBtn = deckSelector.createEl('button', { 
                text: deck.name, 
                cls: `deck-btn ${this.currentDeck === deck.id ? 'active' : ''}` 
            });
            deckBtn.onclick = () => this.selectDeck(deck.id);
        }

        // Create deck button
        const createDeckBtn = deckSelector.createEl('button', { text: '+ New Deck', cls: 'deck-btn create' });
        createDeckBtn.onclick = () => this.createNewDeck();

        // Main content area
        const mainContent = container.createDiv({ cls: 'flashcard-main' });
        
        // Load cards based on mode
        this.loadCards();
        
        if (this.currentCards.length === 0) {
            this.renderEmptyState(mainContent);
        } else {
            this.renderStudyMode(mainContent);
        }

        // Actions bar
        const actionsBar = container.createDiv({ cls: 'flashcard-actions-bar' });
        
        const createCardBtn = actionsBar.createEl('button', { text: '+ Create Card', cls: 'action-btn primary' });
        createCardBtn.onclick = () => this.createNewCard();

        const browseBtn = actionsBar.createEl('button', { text: '📋 Browse All', cls: 'action-btn' });
        browseBtn.onclick = () => this.showBrowseView();

        const searchBtn = actionsBar.createEl('button', { text: '🔍 Search', cls: 'action-btn' });
        searchBtn.onclick = () => this.showSearchView();
    }

    private createModeButton(container: HTMLElement, text: string, mode: 'review' | 'new' | 'all') {
        const btn = container.createEl('button', { 
            text, 
            cls: `mode-btn ${this.studyMode === mode ? 'active' : ''}` 
        });
        btn.onclick = () => {
            this.studyMode = mode;
            this.currentIndex = 0;
            this.isFlipped = false;
            this.renderView(this.containerEl.children[1] as HTMLElement);
        };
    }

    private loadCards() {
        switch (this.studyMode) {
            case 'review':
                this.currentCards = this.plugin.flashcardService.getCardsForReview(this.currentDeck || undefined);
                break;
            case 'new':
                this.currentCards = this.plugin.flashcardService.getNewCards(this.currentDeck || undefined);
                break;
            case 'all':
                const decks = this.currentDeck 
                    ? [this.plugin.flashcardService.getDeck(this.currentDeck)].filter(Boolean)
                    : this.plugin.flashcardService.getDecks();
                this.currentCards = decks.flatMap(d => d?.cards || []);
                break;
        }
    }

    private renderEmptyState(container: HTMLElement) {
        container.empty();
        const empty = container.createDiv({ cls: 'flashcard-empty' });
        
        if (this.studyMode === 'review') {
            empty.createEl('h3', { text: '🎉 All caught up!' });
            empty.createEl('p', { text: 'No cards due for review. Great job!' });
        } else if (this.studyMode === 'new') {
            empty.createEl('h3', { text: '📝 No new cards' });
            empty.createEl('p', { text: 'All new cards have been studied.' });
        } else {
            empty.createEl('h3', { text: '📚 No cards yet' });
            empty.createEl('p', { text: 'Create your first flashcard to get started!' });
        }

        const createBtn = empty.createEl('button', { text: 'Create Flashcard', cls: 'empty-action-btn' });
        createBtn.onclick = () => this.createNewCard();
    }

    private renderStudyMode(container: HTMLElement) {
        container.empty();

        // Progress bar
        const progressBar = container.createDiv({ cls: 'flashcard-progress' });
        const progress = ((this.currentIndex + 1) / this.currentCards.length) * 100;
        const progressFill = progressBar.createDiv({ cls: 'progress-fill' });
        progressFill.style.width = `${progress}%`;
        
        const progressText = container.createEl('p', { 
            text: `Card ${this.currentIndex + 1} of ${this.currentCards.length}`,
            cls: 'progress-text'
        });

        // Card display
        const card = this.currentCards[this.currentIndex];
        const cardContainer = container.createDiv({ cls: 'flashcard-card-container' });
        
        const cardEl = cardContainer.createDiv({ cls: `flashcard-card ${this.isFlipped ? 'flipped' : ''}` });
        
        // Front
        const frontEl = cardEl.createDiv({ cls: 'card-front' });
        frontEl.createEl('p', { text: card.front, cls: 'card-content' });
        frontEl.createEl('span', { text: 'Click to flip', cls: 'flip-hint' });
        
        // Back
        const backEl = cardEl.createDiv({ cls: 'card-back' });
        backEl.createEl('p', { text: card.back, cls: 'card-content' });
        
        // Tags
        if (card.tags.length > 0) {
            const tagsEl = backEl.createDiv({ cls: 'card-tags' });
            for (const tag of card.tags) {
                tagsEl.createEl('span', { text: tag, cls: 'card-tag' });
            }
        }

        // Click to flip
        cardEl.onclick = () => {
            this.isFlipped = !this.isFlipped;
            cardEl.toggleClass('flipped', this.isFlipped);
        };

        // Response buttons (only show when flipped)
        if (this.isFlipped) {
            const responseDiv = container.createDiv({ cls: 'flashcard-response' });
            
            const againBtn = responseDiv.createEl('button', { text: 'Again', cls: 'response-btn again' });
            againBtn.onclick = () => this.rateCard(0);
            
            const hardBtn = responseDiv.createEl('button', { text: 'Hard', cls: 'response-btn hard' });
            hardBtn.onclick = () => this.rateCard(2);
            
            const goodBtn = responseDiv.createEl('button', { text: 'Good', cls: 'response-btn good' });
            goodBtn.onclick = () => this.rateCard(3);
            
            const easyBtn = responseDiv.createEl('button', { text: 'Easy', cls: 'response-btn easy' });
            easyBtn.onclick = () => this.rateCard(5);
        }

        // Navigation
        const navDiv = container.createDiv({ cls: 'flashcard-nav' });
        
        const prevBtn = navDiv.createEl('button', { text: '← Previous', cls: 'nav-btn' });
        prevBtn.onclick = () => this.previousCard();
        prevBtn.disabled = this.currentIndex === 0;
        
        const skipBtn = navDiv.createEl('button', { text: 'Skip →', cls: 'nav-btn' });
        skipBtn.onclick = () => this.nextCard();
    }

    private async rateCard(quality: number) {
        const card = this.currentCards[this.currentIndex];
        await this.plugin.flashcardService.reviewCard(card.deck, card.id, quality);
        await this.plugin.progressService.incrementFlashcardsReviewed();
        
        this.nextCard();
    }

    private nextCard() {
        if (this.currentIndex < this.currentCards.length - 1) {
            this.currentIndex++;
            this.isFlipped = false;
            this.renderView(this.containerEl.children[1] as HTMLElement);
        } else {
            // End of session
            this.showCompletionMessage();
        }
    }

    private previousCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.isFlipped = false;
            this.renderView(this.containerEl.children[1] as HTMLElement);
        }
    }

    private showCompletionMessage() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();

        const completion = container.createDiv({ cls: 'flashcard-completion' });
        completion.createEl('h2', { text: '🎉 Session Complete!' });
        completion.createEl('p', { text: `You reviewed ${this.currentCards.length} cards.` });
        
        const continueBtn = completion.createEl('button', { text: 'Continue Studying', cls: 'completion-btn' });
        continueBtn.onclick = () => {
            this.currentIndex = 0;
            this.loadCards();
            this.renderView(container);
        };

        const doneBtn = completion.createEl('button', { text: 'Done for Now', cls: 'completion-btn secondary' });
        doneBtn.onclick = () => {
            this.studyMode = 'review';
            this.currentIndex = 0;
            this.loadCards();
            this.renderView(container);
        };
    }

    private selectDeck(deckId: string | null) {
        this.currentDeck = deckId;
        this.currentIndex = 0;
        this.isFlipped = false;
        this.renderView(this.containerEl.children[1] as HTMLElement);
    }

    private async createNewDeck() {
        const name = window.prompt('Deck name:');
        if (name) {
            await this.plugin.flashcardService.createDeck(name);
            new Notice(`Deck "${name}" created`);
            this.renderView(this.containerEl.children[1] as HTMLElement);
        }
    }

    private async createNewCard() {
        const decks = this.plugin.flashcardService.getDecks();
        
        if (decks.length === 0) {
            await this.createNewDeck();
            return;
        }

        const front = window.prompt('Front (question):');
        if (!front) return;
        
        const back = window.prompt('Back (answer):');
        if (!back) return;

        const deckId = this.currentDeck || decks[0].id;
        await this.plugin.flashcardService.createCard(deckId, front, back);
        await this.plugin.progressService.incrementFlashcardsCreated();
        
        new Notice('Flashcard created!');
        this.loadCards();
        this.renderView(this.containerEl.children[1] as HTMLElement);
    }

    private showBrowseView() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();

        const header = container.createDiv({ cls: 'browse-header' });
        header.createEl('h2', { text: '📋 All Cards' });
        
        const backBtn = header.createEl('button', { text: '← Back', cls: 'back-btn' });
        backBtn.onclick = () => this.renderView(container);

        const listContainer = container.createDiv({ cls: 'browse-list' });
        
        const allCards: { card: Flashcard; deck: FlashcardDeck }[] = [];
        for (const deck of this.plugin.flashcardService.getDecks()) {
            for (const card of deck.cards) {
                allCards.push({ card, deck });
            }
        }

        if (allCards.length === 0) {
            listContainer.createEl('p', { text: 'No cards yet', cls: 'browse-empty' });
            return;
        }

        for (const { card, deck } of allCards) {
            const item = listContainer.createDiv({ cls: 'browse-item' });
            
            item.createEl('span', { text: card.front, cls: 'browse-front' });
            item.createEl('span', { text: deck.name, cls: 'browse-deck' });
            
            const deleteBtn = item.createEl('button', { text: '×', cls: 'browse-delete' });
            deleteBtn.onclick = async () => {
                await this.plugin.flashcardService.deleteCard(deck.id, card.id);
                this.showBrowseView();
            };
        }
    }

    private showSearchView() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();

        const header = container.createDiv({ cls: 'search-header' });
        header.createEl('h2', { text: '🔍 Search Cards' });
        
        const backBtn = header.createEl('button', { text: '← Back', cls: 'back-btn' });
        backBtn.onclick = () => this.renderView(container);

        const searchInput = container.createEl('input', { 
            type: 'text',
            placeholder: 'Search flashcards...',
            cls: 'search-input'
        });

        const resultsContainer = container.createDiv({ cls: 'search-results' });

        searchInput.oninput = () => {
            const query = searchInput.value;
            if (query.length < 2) {
                resultsContainer.empty();
                return;
            }

            const results = this.plugin.flashcardService.searchCards(query);
            resultsContainer.empty();

            if (results.length === 0) {
                resultsContainer.createEl('p', { text: 'No results found', cls: 'search-empty' });
                return;
            }

            for (const card of results) {
                const item = resultsContainer.createDiv({ cls: 'search-item' });
                item.createEl('p', { text: card.front, cls: 'search-front' });
                item.createEl('p', { text: card.back, cls: 'search-back' });
            }
        };
    }

    async onClose() {
        // Cleanup
    }
}
