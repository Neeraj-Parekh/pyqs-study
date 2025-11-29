/**
 * PYQs Study Platform - PDF Service
 * PDF viewing, annotation, and management using pdf.js
 */

import { TFile, Notice } from 'obsidian';
import { PDFDocument, PDFBookmark, PDFAnnotation } from '../types';
import StudyPlatformPlugin from '../main';

export class PDFService {
    private plugin: StudyPlatformPlugin;
    private documents: Map<string, PDFDocument> = new Map();
    private currentDocument: PDFDocument | null = null;
    private dataFile = 'study-platform-pdf-data.json';
    private pdfLib: any = null;

    constructor(plugin: StudyPlatformPlugin) {
        this.plugin = plugin;
    }

    async initialize(): Promise<void> {
        await this.loadPDFData();
    }

    async loadPDFData(): Promise<void> {
        try {
            const file = this.plugin.app.vault.getAbstractFileByPath(this.dataFile);
            if (file) {
                const content = await this.plugin.app.vault.read(file as any);
                const data = JSON.parse(content);
                
                // Restore documents map
                if (data.documents) {
                    for (const [key, value] of Object.entries(data.documents)) {
                        this.documents.set(key, value as PDFDocument);
                    }
                }
            }
        } catch (error) {
            console.log('No existing PDF data found');
        }
    }

    async savePDFData(): Promise<void> {
        try {
            const data = {
                documents: Object.fromEntries(this.documents),
            };
            
            const content = JSON.stringify(data, null, 2);
            const file = this.plugin.app.vault.getAbstractFileByPath(this.dataFile);
            
            if (file) {
                await this.plugin.app.vault.modify(file as any, content);
            } else {
                await this.plugin.app.vault.create(this.dataFile, content);
            }
        } catch (error) {
            console.error('Failed to save PDF data:', error);
        }
    }

    async openPDF(file: TFile): Promise<PDFDocument> {
        const existingDoc = this.documents.get(file.path);
        
        if (existingDoc) {
            existingDoc.lastOpened = new Date();
            this.currentDocument = existingDoc;
            await this.savePDFData();
            return existingDoc;
        }

        // Create new document entry
        const doc: PDFDocument = {
            id: `pdf-${Date.now()}`,
            path: file.path,
            name: file.basename,
            totalPages: 0, // Will be set when PDF is loaded
            currentPage: 1,
            bookmarks: [],
            annotations: [],
            lastOpened: new Date(),
        };

        this.documents.set(file.path, doc);
        this.currentDocument = doc;
        
        // Update progress
        await this.plugin.progressService.incrementPDFsRead();
        await this.savePDFData();
        
        return doc;
    }

    getCurrentDocument(): PDFDocument | null {
        return this.currentDocument;
    }

    async setCurrentPage(page: number): Promise<void> {
        if (this.currentDocument) {
            this.currentDocument.currentPage = page;
            await this.savePDFData();
        }
    }

    async setTotalPages(totalPages: number): Promise<void> {
        if (this.currentDocument) {
            this.currentDocument.totalPages = totalPages;
            await this.savePDFData();
        }
    }

    async addBookmark(title: string): Promise<PDFBookmark | null> {
        if (!this.currentDocument) return null;

        const bookmark: PDFBookmark = {
            id: `bookmark-${Date.now()}`,
            pageNumber: this.currentDocument.currentPage,
            title,
            createdAt: new Date(),
        };

        this.currentDocument.bookmarks.push(bookmark);
        await this.savePDFData();
        
        new Notice(`Bookmark added: ${title}`);
        return bookmark;
    }

    async removeBookmark(bookmarkId: string): Promise<void> {
        if (!this.currentDocument) return;

        this.currentDocument.bookmarks = this.currentDocument.bookmarks.filter(
            b => b.id !== bookmarkId
        );
        await this.savePDFData();
    }

    getBookmarks(): PDFBookmark[] {
        return this.currentDocument?.bookmarks || [];
    }

    async addAnnotation(
        type: PDFAnnotation['type'],
        content: string,
        position: PDFAnnotation['position']
    ): Promise<PDFAnnotation | null> {
        if (!this.currentDocument) return null;

        const annotation: PDFAnnotation = {
            id: `annotation-${Date.now()}`,
            pageNumber: this.currentDocument.currentPage,
            type,
            content,
            color: this.plugin.settings.pdfAnnotationColor,
            position,
            createdAt: new Date(),
        };

        this.currentDocument.annotations.push(annotation);
        
        if (this.plugin.settings.autoSaveAnnotations) {
            await this.savePDFData();
        }
        
        return annotation;
    }

    async removeAnnotation(annotationId: string): Promise<void> {
        if (!this.currentDocument) return;

        this.currentDocument.annotations = this.currentDocument.annotations.filter(
            a => a.id !== annotationId
        );
        await this.savePDFData();
    }

    getAnnotations(pageNumber?: number): PDFAnnotation[] {
        if (!this.currentDocument) return [];

        if (pageNumber !== undefined) {
            return this.currentDocument.annotations.filter(a => a.pageNumber === pageNumber);
        }

        return this.currentDocument.annotations;
    }

    async updateAnnotationColor(annotationId: string, color: string): Promise<void> {
        if (!this.currentDocument) return;

        const annotation = this.currentDocument.annotations.find(a => a.id === annotationId);
        if (annotation) {
            annotation.color = color;
            await this.savePDFData();
        }
    }

    async exportAnnotationsToNote(): Promise<void> {
        if (!this.currentDocument) {
            new Notice('No PDF document open');
            return;
        }

        const annotations = this.currentDocument.annotations;
        if (annotations.length === 0) {
            new Notice('No annotations to export');
            return;
        }

        let content = `# Annotations: ${this.currentDocument.name}\n\n`;
        content += `**Total Annotations:** ${annotations.length}\n\n`;
        content += `**Exported:** ${new Date().toLocaleString()}\n\n---\n\n`;

        // Group by page
        const byPage = new Map<number, PDFAnnotation[]>();
        for (const annotation of annotations) {
            if (!byPage.has(annotation.pageNumber)) {
                byPage.set(annotation.pageNumber, []);
            }
            byPage.get(annotation.pageNumber)!.push(annotation);
        }

        for (const [page, pageAnnotations] of Array.from(byPage.entries()).sort((a, b) => a[0] - b[0])) {
            content += `## Page ${page}\n\n`;
            for (const annotation of pageAnnotations) {
                const typeIcon = {
                    highlight: '🟡',
                    underline: '➖',
                    note: '📝',
                    drawing: '✏️',
                }[annotation.type];
                
                content += `${typeIcon} **${annotation.type}**\n`;
                content += `> ${annotation.content}\n\n`;
            }
        }

        const noteName = `PDF-Annotations-${this.currentDocument.name}-${Date.now()}.md`;
        await this.plugin.app.vault.create(noteName, content);
        new Notice('Annotations exported to note');
    }

    getRecentDocuments(limit: number = 10): PDFDocument[] {
        return Array.from(this.documents.values())
            .sort((a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime())
            .slice(0, limit);
    }

    async clearDocumentHistory(): Promise<void> {
        this.documents.clear();
        this.currentDocument = null;
        await this.savePDFData();
    }

    // Extract text from PDF for search
    async extractText(file: TFile): Promise<string> {
        try {
            // This would use pdf.js to extract text
            // For now, return a placeholder
            return '';
        } catch (error) {
            console.error('Failed to extract text from PDF:', error);
            return '';
        }
    }
}
