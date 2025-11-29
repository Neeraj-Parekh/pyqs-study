# PYQs Study Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=flat-square)](https://tailwindcss.com/)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-purple?style=flat-square)](https://obsidian.md/)
[![MIT License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](#license)

A comprehensive study platform with question paper access and an Obsidian plugin for focused self-study. **No ads, no banners, no pop-ups - just learning.**

![PYQs Study Platform](https://mitaoe-pyqs.vercel.app/og-image.png)

## 🎯 Platform Features

### Web Application (MITAoE PYQs)
- **Subject-focused organization** - Find papers by subject name
- **Batch download capability** - Get multiple papers at once
- **Mobile-friendly interface** - Access on any device
- **Fast loading** with client-side caching
- **Advanced filtering** by year and exam type
- **Intelligent subject classification** with fuzzy matching
- **Free access** - No login required

### 📚 Obsidian Plugin - Study Platform
A powerful self-study companion for Obsidian with these features:

#### PDF Viewer & Reader
- Open and view PDF files directly in Obsidian
- Navigation controls and zoom
- Bookmarks and annotations
- Export annotations to markdown notes

#### OCR (Optical Character Recognition)
- Extract text from scanned PDFs and images
- Powered by Tesseract.js (open-source)
- Support for 13+ languages
- Create notes from extracted text

#### Flashcards with Spaced Repetition
- Create flashcards from any text
- SM-2 spaced repetition algorithm
- Organize cards into decks
- Daily review tracking

#### Pomodoro Timer
- Built-in focus timer
- Customizable work/break durations
- Track completed sessions

#### Progress Tracking
- Daily and weekly study time
- Streak counter
- Achievement system
- Visual progress charts

See [obsidian-plugin/README.md](obsidian-plugin/README.md) for detailed documentation.

## 📚 Quick Start

### Web Application
Visit [mitaoe-pyqs.vercel.app](https://mitaoe-pyqs.vercel.app) and:
1. Search by subject name (e.g., "Computer Networks")
2. Apply filters for specific years/exam types (optional)
3. Download individual papers or select multiple for batch download

### Obsidian Plugin
1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "PYQs Study Platform"
4. Click Install, then Enable

Or manually install from the `obsidian-plugin` directory.

## 🎓 Supported Departments

- 💻 Computer Engineering
- 🧪 Chemical Engineering
- ⚙️ Mechanical Engineering
- 🏗️ Civil Engineering
- ⚡ Electrical Engineering
- 📡 Electronics & Telecommunication
- ➕ and more.

## 💻 For Developers

### Tech Stack

**Web Application:**
- **Frontend**: Next.js 15
- **Backend**: Next.js API routes
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Deployment**: Vercel

**Obsidian Plugin:**
- **Platform**: Obsidian
- **Language**: TypeScript
- **PDF**: PDF.js
- **OCR**: Tesseract.js (open-source)
- **Build**: esbuild

### Local Development

#### Web Application

```bash
# Clone the repository
git clone https://github.com/mitaoe/pyqs.git
cd pyqs

# Install dependencies
pnpm install

# Copy env file and configure your MongoDB connection
cp .env.example .env
# Edit the .env file and add your MongoDB URI:
# MONGODB_URI=your_mongodb_connection_string_here

# Generate question papers data for local development
pnpm pyq-gen

# Note: During data generation, you may see 400 errors for E&TC directories in the terminal.
# These specific errors are normal and can be safely ignored. If you encounter other errors,
# please create an issue on GitHub. After completion, check your MongoDB database to
# confirm that the data has been generated.

# Run development server
pnpm dev

# Optional: Run crawler for /browse route data
# pnpm crawl
```

#### Obsidian Plugin

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

## 🔒 Privacy & Clean Experience

This project is committed to providing a distraction-free learning experience:

- ✅ **No advertisements** - Ever
- ✅ **No banners** - Clean interface
- ✅ **No pop-ups** - Focus on learning
- ✅ **No pricing** - Completely free
- ✅ **No tracking** - Your data stays with you
- ✅ **No weird AI messages** - Just useful tools
- ✅ **Offline support** - Obsidian plugin works without internet

## Acknowledgements

We extend our sincere gratitude to:

- **MIT Academy of Engineering** for their educational resources that make this project possible
- **Our dedicated contributors** whose passion and expertise continue to enhance this platform
- **The open source community** for providing the remarkable tools that power this application
- **MITAoE students** whose feedback and suggestions help us improve continuously

This project stands as a testament to collaborative efforts in making educational resources more accessible.

## Legal Notice

We don't store any papers - all content is served directly from MITAoE servers. This project is maintained by students for educational purposes.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
