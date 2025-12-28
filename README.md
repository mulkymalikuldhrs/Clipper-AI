# Autonomous AI Clipper

## A — AIM (Project Goal)

This project is an end-to-end, autonomous AI system designed to find, edit, and package short-form video content for platforms like TikTok, Instagram Reels, and YouTube Shorts. It operates in a continuous loop, requiring minimal human intervention.

The core philosophy is that the AI acts as a **decision-maker**, determining *what* to clip and *how* to edit, while the underlying engines execute these decisions.

## T — Tech Stack

- **Backend:** Python
- **Video Processing:** FFmpeg
- **Subtitle Generation:** OpenAI's Whisper
- **AI Decision Making:** LLM7 (currently mocked)
- **Source Discovery:** `yt-dlp`

## G — Getting Started

### Prerequisites

1.  **Python 3.10+**
2.  **FFmpeg:** You must have `ffmpeg` installed and available in your system's PATH. You can download it from [ffmpeg.org](https://ffmpeg.org/download.html) or install it via a package manager:
    ```bash
    # On Debian/Ubuntu
    sudo apt update && sudo apt install ffmpeg

    # On macOS (using Homebrew)
    brew install ffmpeg
    ```

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd autonomous-ai-clipper
    ```

2.  **Create a virtual environment (recommended):**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## X — Execution

The main orchestrator script, `main.py`, runs the entire end-to-end workflow in a continuous, autonomous loop.

### Running the Autonomous Loop

To start the system, run the `main` module from the root of the project:

```bash
python -m src.main
```

The system will now run continuously, performing the following steps in a loop:
1.  **Discover:** Find new videos from online sources.
2.  **Score:** Evaluate each video and approve or reject it.
3.  **Process:** For approved videos, download, clip, edit, subtitle, and add audio.
4.  **Wait:** Pause for a configured duration before starting the next cycle.

### Monitoring the System

All activities are logged to both the console and a file at `/src/logs/clipper.log`. You can monitor this file to see the system's progress:

```bash
tail -f src/logs/clipper.log
```

To stop the system, press `Ctrl+C` in the terminal where it is running.

## F — File Structure

The project is organized into a `src` directory with the following structure:

-   `/src/agents/`: Contains the "thinking" parts of the system.
-   `/src/engines/`: Contains the "acting" parts of the system for heavy lifting.
-   `/src/utils/`: Houses shared utilities for logging, file management, and notifications.
-   `/src/assets/`: Contains sample files for isolated module testing.
-   `/src/output/`: The default directory where all final video files and metadata are stored.
-   `/src/logs/`: Contains the log files for monitoring and debugging.
-   `/src/config.py`: Global configuration for the system.
-   `/src/main.py`: The main orchestrator that runs the autonomous loop.
