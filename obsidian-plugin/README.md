# PYQs Study Platform - Obsidian Plugin

A comprehensive self-study platform for Obsidian. No ads, no banners, no pop-ups - just focused learning.

## Features

### 📄 PDF Viewer & Reader
- Open and view PDF files directly in Obsidian
- Navigate between pages with smooth controls
- Zoom in/out for comfortable reading
- Add bookmarks to important pages
- Create annotations (highlights, underlines, notes)
- Export annotations to markdown notes

### 🔍 OCR (Optical Character Recognition)
- Extract text from scanned PDFs and images
- Powered by Tesseract.js (open-source)
- Support for 13+ languages
- Create notes from extracted text
- Copy text directly to clipboard

### 🃏 Flashcards with Spaced Repetition
- Create flashcards from any text
- SM-2 spaced repetition algorithm
- Organize cards into decks
- Tag cards for easy organization
- Review due cards daily
- Track your learning progress

### ⏱️ Pomodoro Timer
- Built-in focus timer
- Customizable work/break durations
- Auto-start options for breaks
- Track completed pomodoros
- Quick preset timers (25, 45, 60, 90 min)
- Custom duration support

### 📊 Progress Tracking
- Daily and weekly study time tracking
- Streak counter for motivation
- Achievement system
- Session history
- Visual progress charts

### 📝 Quick Notes
- Rapid note creation
- Template support (Lecture, Meeting, Idea, To-Do)
- Folder organization
- Tag support

## Installation

### From Obsidian Community Plugins
1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "PYQs Study Platform"
4. Click Install, then Enable

### Manual Installation
1. Download the latest release
2. Extract to your vault's `.obsidian/plugins/` folder
3. Reload Obsidian
4. Enable the plugin in Settings > Community Plugins

## Building from Source

```bash
# Navigate to the plugin directory
cd obsidian-plugin

# Install dependencies
npm install

# Build for production
npm run build

# Development mode (watch for changes)
npm run dev
```

## Usage

### Quick Start
1. Click the ribbon icons to access different features:
   - 📄 PDF Viewer
   - 🃏 Flashcards
   - 📊 Progress
   - ⏱️ Pomodoro Timer

2. Use the Command Palette (Ctrl/Cmd + P) for quick access:
   - "Open PDF Viewer"
   - "Study Flashcards"
   - "Create Flashcard"
   - "Start Pomodoro"
   - "View Progress"
   - "Quick Note"

### Creating Flashcards
1. Select text in any note
2. Right-click and choose "Create Flashcard"
3. Or use Command Palette > "Create New Flashcard"

### PDF Reading
1. Click the PDF icon in the ribbon
2. Select a PDF file from your vault
3. Use toolbar buttons for navigation and annotation

### OCR
1. Open a PDF or image file
2. Use Command Palette > "Run OCR on PDF"
3. Select language and process
4. Save results as a new note

## Settings

Access settings via Settings > PYQs Study Platform:

- **General**: Status bar, notifications
- **PDF Viewer**: Default zoom, annotation color, auto-save
- **OCR**: Default language, auto-process
- **Flashcards**: Cards per day, ease settings
- **Pomodoro**: Work/break durations, auto-start
- **Progress**: Daily/weekly goals

## Privacy

This plugin:
- ✅ Works completely offline
- ✅ Stores all data locally in your vault
- ✅ No tracking or analytics
- ✅ No external API calls (except for OCR language data)
- ✅ No ads or promotional content
- ✅ No pricing or upsells

## Open Source Libraries

This plugin uses these open-source libraries:
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering

## Support

- Report bugs: [GitHub Issues](https://github.com/Neeraj-Parekh/pyqs-study/issues)
- Feature requests: [GitHub Discussions](https://github.com/Neeraj-Parekh/pyqs-study/discussions)

## License

MIT License - See [LICENSE](../LICENSE) for details.

---

**Focus on learning. No distractions.**
