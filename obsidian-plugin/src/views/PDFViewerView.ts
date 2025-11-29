/**
 * PYQs Study Platform - PDF Viewer View
 * Clean PDF viewing experience with annotations
 */

import { ItemView, WorkspaceLeaf, TFile, Notice, Menu } from 'obsidian';
import StudyPlatformPlugin from '../main';

export const PDF_VIEWER_VIEW_TYPE = 'pyqs-pdf-viewer';

export class PDFViewerView extends ItemView {
    private plugin: StudyPlatformPlugin;
    private pdfContainer: HTMLElement | null = null;
    private currentFile: TFile | null = null;
    private currentPage: number = 1;
    private totalPages: number = 0;
    private zoom: number = 100;
    private pdfDoc: any = null;

    constructor(leaf: WorkspaceLeaf, plugin: StudyPlatformPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.zoom = plugin.settings.defaultPDFZoom;
    }

    getViewType(): string {
        return PDF_VIEWER_VIEW_TYPE;
    }

    getDisplayText(): string {
        return this.currentFile ? `PDF: ${this.currentFile.basename}` : 'PDF Viewer';
    }

    getIcon(): string {
        return 'file-text';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('pyqs-pdf-viewer');

        // Create toolbar
        const toolbar = container.createDiv({ cls: 'pdf-toolbar' });
        this.createToolbar(toolbar);

        // Create PDF container
        this.pdfContainer = container.createDiv({ cls: 'pdf-container' });

        // Create sidebar for bookmarks/annotations
        const sidebar = container.createDiv({ cls: 'pdf-sidebar' });
        this.createSidebar(sidebar);

        // Show welcome message
        this.showWelcome();
    }

    private createToolbar(toolbar: HTMLElement) {
        // File picker
        const openBtn = toolbar.createEl('button', { text: 'Open PDF', cls: 'pdf-btn' });
        openBtn.onclick = () => this.openFilePicker();

        // Navigation
        const navGroup = toolbar.createDiv({ cls: 'pdf-nav-group' });
        
        const prevBtn = navGroup.createEl('button', { text: '←', cls: 'pdf-btn' });
        prevBtn.onclick = () => this.goToPage(this.currentPage - 1);

        const pageInput = navGroup.createEl('input', { 
            type: 'number',
            cls: 'pdf-page-input',
            value: String(this.currentPage),
        });
        pageInput.onchange = () => this.goToPage(parseInt(pageInput.value));

        const pageCount = navGroup.createEl('span', { 
            text: ` / ${this.totalPages}`,
            cls: 'pdf-page-count'
        });

        const nextBtn = navGroup.createEl('button', { text: '→', cls: 'pdf-btn' });
        nextBtn.onclick = () => this.goToPage(this.currentPage + 1);

        // Zoom controls
        const zoomGroup = toolbar.createDiv({ cls: 'pdf-zoom-group' });
        
        const zoomOutBtn = zoomGroup.createEl('button', { text: '−', cls: 'pdf-btn' });
        zoomOutBtn.onclick = () => this.setZoom(this.zoom - 10);

        const zoomLabel = zoomGroup.createEl('span', { 
            text: `${this.zoom}%`,
            cls: 'pdf-zoom-label'
        });

        const zoomInBtn = zoomGroup.createEl('button', { text: '+', cls: 'pdf-btn' });
        zoomInBtn.onclick = () => this.setZoom(this.zoom + 10);

        // Actions
        const actionsGroup = toolbar.createDiv({ cls: 'pdf-actions-group' });

        const bookmarkBtn = actionsGroup.createEl('button', { text: '🔖 Bookmark', cls: 'pdf-btn' });
        bookmarkBtn.onclick = () => this.addBookmark();

        const annotateBtn = actionsGroup.createEl('button', { text: '✏️ Annotate', cls: 'pdf-btn' });
        annotateBtn.onclick = () => this.showAnnotationMenu();

        const ocrBtn = actionsGroup.createEl('button', { text: '📄 OCR', cls: 'pdf-btn' });
        ocrBtn.onclick = () => this.runOCR();

        const exportBtn = actionsGroup.createEl('button', { text: '📤 Export', cls: 'pdf-btn' });
        exportBtn.onclick = () => this.exportAnnotations();
    }

    private createSidebar(sidebar: HTMLElement) {
        // Tabs
        const tabs = sidebar.createDiv({ cls: 'pdf-sidebar-tabs' });
        
        const bookmarksTab = tabs.createEl('button', { text: 'Bookmarks', cls: 'pdf-sidebar-tab active' });
        const annotationsTab = tabs.createEl('button', { text: 'Annotations', cls: 'pdf-sidebar-tab' });
        const outlineTab = tabs.createEl('button', { text: 'Outline', cls: 'pdf-sidebar-tab' });

        // Content
        const content = sidebar.createDiv({ cls: 'pdf-sidebar-content' });
        
        // Bookmarks panel
        const bookmarksPanel = content.createDiv({ cls: 'pdf-panel pdf-bookmarks-panel' });
        this.renderBookmarks(bookmarksPanel);

        // Annotations panel
        const annotationsPanel = content.createDiv({ cls: 'pdf-panel pdf-annotations-panel hidden' });
        this.renderAnnotations(annotationsPanel);

        // Outline panel
        const outlinePanel = content.createDiv({ cls: 'pdf-panel pdf-outline-panel hidden' });
        outlinePanel.createEl('p', { text: 'PDF outline will appear here', cls: 'pdf-panel-empty' });

        // Tab switching
        bookmarksTab.onclick = () => {
            tabs.querySelectorAll('.pdf-sidebar-tab').forEach(t => t.removeClass('active'));
            content.querySelectorAll('.pdf-panel').forEach(p => p.addClass('hidden'));
            bookmarksTab.addClass('active');
            bookmarksPanel.removeClass('hidden');
        };

        annotationsTab.onclick = () => {
            tabs.querySelectorAll('.pdf-sidebar-tab').forEach(t => t.removeClass('active'));
            content.querySelectorAll('.pdf-panel').forEach(p => p.addClass('hidden'));
            annotationsTab.addClass('active');
            annotationsPanel.removeClass('hidden');
        };

        outlineTab.onclick = () => {
            tabs.querySelectorAll('.pdf-sidebar-tab').forEach(t => t.removeClass('active'));
            content.querySelectorAll('.pdf-panel').forEach(p => p.addClass('hidden'));
            outlineTab.addClass('active');
            outlinePanel.removeClass('hidden');
        };
    }

    private showWelcome() {
        if (!this.pdfContainer) return;
        this.pdfContainer.empty();

        const welcome = this.pdfContainer.createDiv({ cls: 'pdf-welcome' });
        welcome.createEl('h2', { text: '📄 PDF Viewer' });
        welcome.createEl('p', { text: 'Open a PDF file to start reading' });
        
        const features = welcome.createEl('ul', { cls: 'pdf-features' });
        features.createEl('li', { text: '📖 Read PDFs with smooth navigation' });
        features.createEl('li', { text: '🔖 Add bookmarks to important pages' });
        features.createEl('li', { text: '✏️ Annotate with highlights and notes' });
        features.createEl('li', { text: '📄 Extract text with OCR' });
        features.createEl('li', { text: '📤 Export annotations to notes' });

        const openBtn = welcome.createEl('button', { text: 'Open PDF', cls: 'pdf-welcome-btn' });
        openBtn.onclick = () => this.openFilePicker();

        // Recent documents
        const recent = this.plugin.pdfService.getRecentDocuments(5);
        if (recent.length > 0) {
            welcome.createEl('h3', { text: 'Recent Documents' });
            const recentList = welcome.createEl('ul', { cls: 'pdf-recent-list' });
            
            for (const doc of recent) {
                const item = recentList.createEl('li');
                const link = item.createEl('a', { text: doc.name });
                link.onclick = async () => {
                    const file = this.plugin.app.vault.getAbstractFileByPath(doc.path);
                    if (file instanceof TFile) {
                        await this.loadPDF(file);
                    }
                };
            }
        }
    }

    private renderBookmarks(container: HTMLElement) {
        container.empty();
        
        const bookmarks = this.plugin.pdfService.getBookmarks();
        
        if (bookmarks.length === 0) {
            container.createEl('p', { text: 'No bookmarks yet', cls: 'pdf-panel-empty' });
            return;
        }

        for (const bookmark of bookmarks) {
            const item = container.createDiv({ cls: 'pdf-bookmark-item' });
            
            const title = item.createEl('span', { text: bookmark.title, cls: 'pdf-bookmark-title' });
            title.onclick = () => this.goToPage(bookmark.pageNumber);
            
            const page = item.createEl('span', { text: `Page ${bookmark.pageNumber}`, cls: 'pdf-bookmark-page' });
            
            const deleteBtn = item.createEl('button', { text: '×', cls: 'pdf-bookmark-delete' });
            deleteBtn.onclick = async () => {
                await this.plugin.pdfService.removeBookmark(bookmark.id);
                this.renderBookmarks(container);
            };
        }
    }

    private renderAnnotations(container: HTMLElement) {
        container.empty();
        
        const annotations = this.plugin.pdfService.getAnnotations();
        
        if (annotations.length === 0) {
            container.createEl('p', { text: 'No annotations yet', cls: 'pdf-panel-empty' });
            return;
        }

        for (const annotation of annotations) {
            const item = container.createDiv({ cls: 'pdf-annotation-item' });
            
            const typeIcon = {
                highlight: '🟡',
                underline: '➖',
                note: '📝',
                drawing: '✏️',
            }[annotation.type];
            
            item.createEl('span', { text: `${typeIcon} Page ${annotation.pageNumber}`, cls: 'pdf-annotation-header' });
            item.createEl('p', { text: annotation.content, cls: 'pdf-annotation-content' });
            
            const actions = item.createDiv({ cls: 'pdf-annotation-actions' });
            
            const goBtn = actions.createEl('button', { text: 'Go', cls: 'pdf-btn-small' });
            goBtn.onclick = () => this.goToPage(annotation.pageNumber);
            
            const deleteBtn = actions.createEl('button', { text: '×', cls: 'pdf-btn-small' });
            deleteBtn.onclick = async () => {
                await this.plugin.pdfService.removeAnnotation(annotation.id);
                this.renderAnnotations(container);
            };
        }
    }

    private async openFilePicker() {
        // Get all PDF files in vault
        const pdfFiles = this.plugin.app.vault.getFiles().filter(f => f.extension === 'pdf');
        
        if (pdfFiles.length === 0) {
            new Notice('No PDF files found in vault');
            return;
        }

        // Show file picker (simplified - in real implementation, use a modal)
        const menu = new Menu();
        
        for (const file of pdfFiles.slice(0, 20)) { // Limit to 20 files
            menu.addItem((item) => {
                item.setTitle(file.basename)
                    .onClick(() => this.loadPDF(file));
            });
        }

        // Show menu at center of container
        const containerRect = this.containerEl.getBoundingClientRect();
        menu.showAtPosition({
            x: containerRect.left + containerRect.width / 2,
            y: containerRect.top + 100
        });
    }

    async loadPDF(file: TFile) {
        this.currentFile = file;
        await this.plugin.pdfService.openPDF(file);
        
        if (!this.pdfContainer) return;
        this.pdfContainer.empty();

        // Show loading
        this.pdfContainer.createEl('p', { text: 'Loading PDF...', cls: 'pdf-loading' });

        try {
            // Read file and create blob URL
            const arrayBuffer = await this.plugin.app.vault.readBinary(file);
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // Create embed element for PDF
            this.pdfContainer.empty();
            
            const embed = this.pdfContainer.createEl('embed', {
                cls: 'pdf-embed',
                attr: {
                    src: url,
                    type: 'application/pdf',
                    width: '100%',
                    height: '100%',
                },
            });

            // View title is automatically updated through getDisplayText()
        } catch (error) {
            console.error('Failed to load PDF:', error);
            this.pdfContainer.empty();
            this.pdfContainer.createEl('p', { 
                text: 'Failed to load PDF. Please try again.',
                cls: 'pdf-error'
            });
        }
    }

    private goToPage(page: number) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.plugin.pdfService.setCurrentPage(page);
        // Update UI
    }

    private setZoom(zoom: number) {
        if (zoom < 25 || zoom > 400) return;
        this.zoom = zoom;
        // Update UI
    }

    private async addBookmark() {
        const title = await this.promptForInput('Bookmark title', `Page ${this.currentPage}`);
        if (title) {
            await this.plugin.pdfService.addBookmark(title);
            // Refresh bookmarks panel
        }
    }

    private showAnnotationMenu() {
        const menu = new Menu();
        
        menu.addItem((item) => {
            item.setTitle('Highlight')
                .setIcon('highlighter')
                .onClick(() => this.addAnnotation('highlight'));
        });
        
        menu.addItem((item) => {
            item.setTitle('Add Note')
                .setIcon('message-square')
                .onClick(() => this.addAnnotation('note'));
        });
        
        menu.addItem((item) => {
            item.setTitle('Underline')
                .setIcon('underline')
                .onClick(() => this.addAnnotation('underline'));
        });

        // Show menu at center of container
        const containerRect = this.containerEl.getBoundingClientRect();
        menu.showAtPosition({
            x: containerRect.left + containerRect.width / 2,
            y: containerRect.top + 100
        });
    }

    private async addAnnotation(type: 'highlight' | 'underline' | 'note' | 'drawing') {
        const content = await this.promptForInput('Annotation content', '');
        if (content) {
            await this.plugin.pdfService.addAnnotation(type, content, {
                x: 0,
                y: 0,
                width: 100,
                height: 20,
            });
            new Notice('Annotation added');
        }
    }

    private async runOCR() {
        if (!this.currentFile) {
            new Notice('No PDF file open');
            return;
        }

        await this.plugin.runOCROnFile(this.currentFile);
    }

    private async exportAnnotations() {
        await this.plugin.pdfService.exportAnnotationsToNote();
    }

    private promptForInput(title: string, defaultValue: string): Promise<string | null> {
        return new Promise((resolve) => {
            const result = window.prompt(title, defaultValue);
            resolve(result);
        });
    }

    async onClose() {
        // Cleanup
    }
}
