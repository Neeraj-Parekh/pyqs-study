/**
 * PYQs Study Platform - Flashcard Service
 * Implements SM-2 spaced repetition algorithm
 */

import { Flashcard, FlashcardDeck } from '../types';
import StudyPlatformPlugin from '../main';

export class FlashcardService {
    private plugin: StudyPlatformPlugin;
    private decks: FlashcardDeck[] = [];
    private dataFile = 'study-platform-flashcards.json';

    constructor(plugin: StudyPlatformPlugin) {
        this.plugin = plugin;
    }

    async loadDecks(): Promise<void> {
        try {
            const file = this.plugin.app.vault.getAbstractFileByPath(this.dataFile);
            if (file) {
                const content = await this.plugin.app.vault.read(file as any);
                this.decks = JSON.parse(content);
            }
        } catch (error) {
            console.log('No existing flashcard data found, starting fresh');
            this.decks = [];
        }
    }

    async saveDecks(): Promise<void> {
        try {
            const content = JSON.stringify(this.decks, null, 2);
            const file = this.plugin.app.vault.getAbstractFileByPath(this.dataFile);
            
            if (file) {
                await this.plugin.app.vault.modify(file as any, content);
            } else {
                await this.plugin.app.vault.create(this.dataFile, content);
            }
        } catch (error) {
            console.error('Failed to save flashcard data:', error);
        }
    }

    getDecks(): FlashcardDeck[] {
        return this.decks;
    }

    getDeck(id: string): FlashcardDeck | undefined {
        return this.decks.find(d => d.id === id);
    }

    async createDeck(name: string, description: string = ''): Promise<FlashcardDeck> {
        const deck: FlashcardDeck = {
            id: `deck-${Date.now()}`,
            name,
            description,
            cards: [],
            createdAt: new Date(),
        };
        
        this.decks.push(deck);
        await this.saveDecks();
        return deck;
    }

    async deleteDeck(id: string): Promise<void> {
        this.decks = this.decks.filter(d => d.id !== id);
        await this.saveDecks();
    }

    async createCard(deckId: string, front: string, back: string, tags: string[] = []): Promise<Flashcard> {
        const deck = this.getDeck(deckId);
        if (!deck) throw new Error('Deck not found');

        const card: Flashcard = {
            id: `card-${Date.now()}`,
            front,
            back,
            deck: deckId,
            tags,
            createdAt: new Date(),
            easeFactor: 2.5, // Default ease factor for SM-2
            interval: 0,
            repetitions: 0,
        };

        deck.cards.push(card);
        await this.saveDecks();
        return card;
    }

    async deleteCard(deckId: string, cardId: string): Promise<void> {
        const deck = this.getDeck(deckId);
        if (!deck) return;

        deck.cards = deck.cards.filter(c => c.id !== cardId);
        await this.saveDecks();
    }

    async updateCard(deckId: string, cardId: string, updates: Partial<Flashcard>): Promise<void> {
        const deck = this.getDeck(deckId);
        if (!deck) return;

        const cardIndex = deck.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        deck.cards[cardIndex] = { ...deck.cards[cardIndex], ...updates };
        await this.saveDecks();
    }

    /**
     * SM-2 Algorithm Implementation
     * Quality ratings: 0-5 (0-2 = fail, 3-5 = pass)
     */
    async reviewCard(deckId: string, cardId: string, quality: number): Promise<void> {
        const deck = this.getDeck(deckId);
        if (!deck) return;

        const card = deck.cards.find(c => c.id === cardId);
        if (!card) return;

        // SM-2 Algorithm
        if (quality < 3) {
            // Failed - reset
            card.repetitions = 0;
            card.interval = 1;
        } else {
            // Passed
            if (card.repetitions === 0) {
                card.interval = 1;
            } else if (card.repetitions === 1) {
                card.interval = 6;
            } else {
                card.interval = Math.round(card.interval * card.easeFactor * this.plugin.settings.intervalModifier);
            }
            card.repetitions++;
        }

        // Update ease factor
        card.easeFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
        
        // Apply ease bonus for easy responses
        if (quality === 5) {
            card.easeFactor *= this.plugin.settings.easeBonus;
        }

        card.lastReviewed = new Date();
        card.nextReview = new Date(Date.now() + card.interval * 24 * 60 * 60 * 1000);

        deck.lastStudied = new Date();
        await this.saveDecks();
    }

    getCardsForReview(deckId?: string): Flashcard[] {
        const now = new Date();
        const cards: Flashcard[] = [];

        const decksToCheck = deckId ? [this.getDeck(deckId)].filter(Boolean) as FlashcardDeck[] : this.decks;

        for (const deck of decksToCheck) {
            for (const card of deck.cards) {
                if (!card.nextReview || new Date(card.nextReview) <= now) {
                    cards.push(card);
                }
            }
        }

        // Sort by next review date (oldest first)
        return cards.sort((a, b) => {
            if (!a.nextReview) return -1;
            if (!b.nextReview) return 1;
            return new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime();
        });
    }

    getNewCards(deckId?: string, limit?: number): Flashcard[] {
        const maxCards = limit || this.plugin.settings.newCardsPerDay;
        const cards: Flashcard[] = [];

        const decksToCheck = deckId ? [this.getDeck(deckId)].filter(Boolean) as FlashcardDeck[] : this.decks;

        for (const deck of decksToCheck) {
            for (const card of deck.cards) {
                if (card.repetitions === 0 && cards.length < maxCards) {
                    cards.push(card);
                }
            }
        }

        return cards.slice(0, maxCards);
    }

    getStats(): { totalCards: number; newCards: number; reviewCards: number; totalDecks: number } {
        let totalCards = 0;
        let newCards = 0;
        let reviewCards = 0;

        const now = new Date();

        for (const deck of this.decks) {
            totalCards += deck.cards.length;
            for (const card of deck.cards) {
                if (card.repetitions === 0) {
                    newCards++;
                } else if (!card.nextReview || new Date(card.nextReview) <= now) {
                    reviewCards++;
                }
            }
        }

        return {
            totalCards,
            newCards,
            reviewCards,
            totalDecks: this.decks.length,
        };
    }

    searchCards(query: string): Flashcard[] {
        const lowerQuery = query.toLowerCase();
        const results: Flashcard[] = [];

        for (const deck of this.decks) {
            for (const card of deck.cards) {
                if (
                    card.front.toLowerCase().includes(lowerQuery) ||
                    card.back.toLowerCase().includes(lowerQuery) ||
                    card.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
                ) {
                    results.push(card);
                }
            }
        }

        return results;
    }
}
