/**
 * PYQs Study Platform - OCR Service
 * Uses Tesseract.js (open source) for text recognition
 */

import { TFile } from 'obsidian';
import { OCRResult } from '../types';
import StudyPlatformPlugin from '../main';

export class OCRService {
    private plugin: StudyPlatformPlugin;
    private worker: any = null;

    constructor(plugin: StudyPlatformPlugin) {
        this.plugin = plugin;
    }

    async initializeWorker(): Promise<void> {
        if (this.worker) return;

        try {
            // Dynamic import of Tesseract.js
            const Tesseract = await import('tesseract.js');
            this.worker = await Tesseract.createWorker(this.plugin.settings.ocrLanguage);
        } catch (error) {
            console.error('Failed to initialize Tesseract worker:', error);
            throw new Error('OCR initialization failed. Please check your internet connection.');
        }
    }

    async processFile(file: TFile): Promise<OCRResult> {
        await this.initializeWorker();

        try {
            // Read the file as array buffer
            const arrayBuffer = await this.plugin.app.vault.readBinary(file);
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            
            // For PDFs, we need to convert to images first
            // This is a simplified version - full implementation would use pdf.js
            const result = await this.processImage(blob);
            
            return {
                id: `ocr-${Date.now()}`,
                sourceFile: file.path,
                text: result.text,
                confidence: result.confidence,
                processedAt: new Date(),
                language: this.plugin.settings.ocrLanguage,
            };
        } catch (error) {
            console.error('OCR processing error:', error);
            throw error;
        }
    }

    async processImage(imageData: Blob | string): Promise<{ text: string; confidence: number }> {
        await this.initializeWorker();

        try {
            const { data } = await this.worker.recognize(imageData);
            return {
                text: data.text,
                confidence: data.confidence / 100,
            };
        } catch (error) {
            console.error('Image OCR error:', error);
            throw error;
        }
    }

    async processMultiplePages(images: (Blob | string)[]): Promise<{ text: string; confidence: number }[]> {
        const results: { text: string; confidence: number }[] = [];
        
        for (const image of images) {
            const result = await this.processImage(image);
            results.push(result);
        }
        
        return results;
    }

    async changeLanguage(language: string): Promise<void> {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
        
        this.plugin.settings.ocrLanguage = language;
        await this.plugin.saveSettings();
        await this.initializeWorker();
    }

    async terminate(): Promise<void> {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }

    getSupportedLanguages(): { code: string; name: string }[] {
        return [
            { code: 'eng', name: 'English' },
            { code: 'fra', name: 'French' },
            { code: 'deu', name: 'German' },
            { code: 'spa', name: 'Spanish' },
            { code: 'ita', name: 'Italian' },
            { code: 'por', name: 'Portuguese' },
            { code: 'rus', name: 'Russian' },
            { code: 'chi_sim', name: 'Chinese (Simplified)' },
            { code: 'chi_tra', name: 'Chinese (Traditional)' },
            { code: 'jpn', name: 'Japanese' },
            { code: 'kor', name: 'Korean' },
            { code: 'ara', name: 'Arabic' },
            { code: 'hin', name: 'Hindi' },
        ];
    }
}
