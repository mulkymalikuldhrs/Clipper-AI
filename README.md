<!-- BANNER -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:1a0f00,50:2d1f00,100:3d2b00&fontColor=f97316&descColor=fbbf24&height=220&section=header&text=Clipper%20AI&fontSize=70&desc=AI%20Clipboard%20Manager&animation=fadeIn" />

<!-- TYPING SVG -->
<div align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=1000&color=F97316&center=true&vCenter=true&width=600&lines=Smart+Clipboard+Management;AI-Powered+Categorization;Quick+Access+%2B+Search;Early+Stage+%E2%80%94+Accuracy+Varies" alt="Typing SVG" />
  </a>
</div>

<br/>

<!-- BADGES -->
<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

</div>

---

## Overview

**Clipper AI** is an AI-powered clipboard manager that automatically categorizes, tags, and makes searchable everything you copy. Text snippets, URLs, code blocks, images — Clipper AI understands what you've copied and organizes it so you can find it later without digging through a chaotic clipboard history.

## Features

### AI-Powered Organization
- **AI Categorization** — Automatically classifies clipboard content (code, URLs, emails, addresses, notes, etc.)
- **Smart Tags** — AI-generated tags for each clip for effortless retrieval
- **Content Summarization** — Brief summaries of long copied text
- **Code Detection** — Identifies programming language and adds syntax context

### Search & Access
- **Smart Search** — Find anything by content, category, or AI-generated tags
- **Quick Paste** — Keyboard shortcuts for instant access to favorite clips
- **Fuzzy Matching** — Find clips even with partial or approximate search terms
- **Pin Favorites** — Pin frequently used clips for one-key access

### Privacy & Security
- **Privacy Mode** — Exclude sensitive apps from clipboard monitoring
- **Auto-Clear** — Automatically remove clips containing sensitive patterns (passwords, tokens)
- **Local-First** — All data stored locally by default
- **Encryption** — Optional encryption for stored clipboard history

### Sync & Sharing
- **Cross-Device Sync** — Optional end-to-end encrypted sync between your devices
- **Clip Sharing** — Share specific clips with teammates via secure links

## Honest Notes

- **Early Stage** — Clipper AI is under active development. Features may change and bugs are expected.
- **AI Categorization Accuracy Varies** — The AI does a good job with common content types but may misclassify unusual or ambiguous content. Manual correction is sometimes needed.
- **Platform Support** — Currently focused on desktop (Electron). Mobile support is planned but not yet available.
- **Clipboard Access** — The app monitors your clipboard continuously. While privacy mode helps, be mindful of what you copy while the app is running.

## Quick Start

### Prerequisites
- Node.js 18+
- LLM API key for AI categorization features

### Installation

```bash
git clone https://github.com/mulkymalikuldhrs/Clipper-AI.git
cd Clipper-AI
npm install
cp .env.example .env
```

### Configuration

```env
OPENAI_API_KEY=your_key
SYNC_ENABLED=false
ENCRYPTION_KEY=your_optional_key
```

### Running

```bash
# Development
npm run dev

# Build desktop app
npm run build:electron
```

## Project Structure

```
Clipper-AI/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # UI components
│   ├── lib/
│   │   ├── clipboard/  # Clipboard monitoring
│   │   ├── ai/         # AI categorization engine
│   │   ├── search/     # Search & indexing
│   │   ├── sync/       # Cross-device sync
│   │   └── privacy/    # Privacy & encryption
│   └── types/          # TypeScript definitions
└── tests/              # Test suites
```

## Visual Architecture

### Planned Architecture (NOT YET BUILT)

```mermaid
flowchart TB
    subgraph Electron["🖥️ Electron Desktop App (PLANNED)"]
        subgraph MainProcess["Main Process"]
            ClipboardMonitor["📋 Clipboard Monitor<br/>OS-level clipboard events"]
            IPC["🔌 IPC Bridge"]
            TrayIcon["📌 System Tray<br/>Quick Access Menu"]
        end

        subgraph RendererProcess["Renderer Process (UI)"]
            Dashboard["📊 Clip Dashboard<br/>Category View"]
            SearchBar["🔍 Smart Search<br/>Fuzzy + AI-powered"]
            Settings["⚙️ Settings<br/>Privacy & Sync"]
        end

        subgraph AIEngine["🤖 AI Engine (PLANNED)"]
            Classifier["Content Classifier<br/>Code / URL / Email<br/>Note / Address / Image"]
            Tagger["Smart Tagger<br/>Auto-generated labels"]
            Summarizer["Summarizer<br/>Long text condensation"]
            CodeDetector["Code Detector<br/>Language identification"]
        end

        subgraph DataLayer["💾 Data Layer (PLANNED)"]
            LocalDB["SQLite / IndexedDB<br/>Local-first storage"]
            Encryptor["AES-256 Encryption<br/>Optional privacy layer"]
            SyncEngine["E2E Encrypted Sync<br/>Cross-device (PLANNED)"]
        end
    end

    ClipboardMonitor --> Classifier
    Classifier --> Tagger
    Classifier --> Summarizer
    Classifier --> CodeDetector
    Tagger --> LocalDB
    LocalDB --> Dashboard
    LocalDB --> SearchBar
    Dashboard --> IPC
    IPC --> TrayIcon
    LocalDB --> Encryptor
    Encryptor --> SyncEngine

    style Electron fill:#1a0f00,stroke:#f97316,color:#fef3c7
    style MainProcess fill:#2d1f00,stroke:#fbbf24,color:#fef3c7
    style RendererProcess fill:#2d1f00,stroke:#fbbf24,color:#fef3c7
    style AIEngine fill:#3d2b00,stroke:#f97316,color:#fef3c7
    style DataLayer fill:#3d2b00,stroke:#f97316,color:#fef3c7
```

### Planned Clipboard Pipeline (NOT YET BUILT)

```mermaid
flowchart LR
    subgraph Capture["1️⃣ Capture"]
        A[User Copies Content] --> B[OS Clipboard Event]
        B --> C[Clipper Detects Change]
    end

    subgraph Analyze["2️⃣ AI Analysis"]
        C --> D{Content Type?}
        D -->|Code| E[Detect Language + Syntax]
        D -->|URL| F[Extract Title + Favicon]
        D -->|Email| G[Parse Sender + Subject]
        D -->|Text| H[Summarize + Tag]
        D -->|Image| I[OCR + Description]
    end

    subgraph Store["3️⃣ Store & Index"]
        E --> J[Write to Local DB]
        F --> J
        G --> J
        H --> J
        I --> J
        J --> K[Full-Text Search Index]
        J --> L[Tag Index]
    end

    subgraph Retrieve["4️⃣ Retrieve"]
        K --> M[Quick Search Results]
        L --> M
        M --> N[Keyboard Shortcut Paste]
    end

    style Capture fill:#1a0f00,stroke:#f97316,color:#fef3c7
    style Analyze fill:#2d1f00,stroke:#fbbf24,color:#fef3c7
    style Store fill:#3d2b00,stroke:#f97316,color:#fef3c7
    style Retrieve fill:#2d1f00,stroke:#fbbf24,color:#fef3c7
```

### Implementation Status — BE HONEST

```mermaid
graph TD
    subgraph Reality["🚨 ACTUAL STATUS — CONCEPT ONLY"]
        direction TB

        subgraph NotBuilt["❌ NOT IMPLEMENTED"]
            N1["Electron App — 0%"]
            N2["Clipboard Monitor — 0%"]
            N3["AI Categorization — 0%"]
            N4["Smart Search — 0%"]
            N5["Local Storage — 0%"]
            N6["Cross-Device Sync — 0%"]
            N7["Privacy Mode — 0%"]
            N8["Encryption — 0%"]
        end

        subgraph Built["✅ WHAT EXISTS"]
            B1["README.md — This file"]
            B2["LICENSE — MIT"]
            B3["CONTRIBUTING.md — Template"]
            B4["SECURITY.md — Template"]
            B5["CHANGELOG.md — Empty"]
        end
    end

    subgraph Verdict["⚠️ VERDICT"]
        V["THIS IS VAPORWARE<br/>No source code exists.<br/>No application can be built or run.<br/>All features described above are<br/>ASPIRATIONAL and UNIMPLEMENTED."]
    end

    NotBuilt --> Verdict

    style Reality fill:#1a0f00,stroke:#ef4444,color:#fecaca
    style NotBuilt fill:#7f1d1d,stroke:#ef4444,color:#fecaca
    style Built fill:#14532d,stroke:#22c55e,color:#bbf7d0
    style Verdict fill:#7f1d1d,stroke:#ef4444,color:#fecaca
    style V fill:#991b1b,stroke:#fca5a5,color:#fef2f2
```

> **Brutally Honest:** Clipper AI is vaporware. There is no source code, no working application, and no functional prototype. The features described in this README represent a concept and wish list — nothing more. The `npm install` and `npm run dev` commands listed above will not work because no code has been written. This project exists as an idea and documentation only.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

Especially welcome: better categorization models, new platform support, and UI improvements.

## Disclaimer

Clipper AI accesses your clipboard contents for categorization. While privacy mode excludes specified apps, be aware of what you copy. The authors are not responsible for any data exposure through the clipboard manager.

## License

**MIT License** — see [LICENSE](./LICENSE) for details.

## Author

<div align="center">

**Mulky Malikul Dhaher**

[![GitHub](https://img.shields.io/badge/GitHub-mulkymalikuldhrs-181717?style=flat-square&logo=github)](https://github.com/mulkymalikuldhrs)
[![Email](https://img.shields.io/badge/Email-mulkymalikudhr@mail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:mulkymalikudhr@mail.com)

</div>

---

<!-- FOOTER BANNER -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:1a0f00,50:2d1f00,100:3d2b00&fontColor=f97316&descColor=fbbf24&height=120&section=footer&text=&fontSize=0" />
