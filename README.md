# Autonomous AI Clipper

**End-to-End · Full Auto · Production-Ready**

**Owner:** Mulky Malikul Dhaher
**Contact:** mulkymalikuldhr@mail.com

---

## A — AIM (Project Goal)

Autonomous AI Clipper is a fully autonomous, production-ready system designed to find, edit, and package short-form video content for platforms like TikTok, Instagram Reels, and YouTube Shorts. It operates in a continuous loop, using AI to make creative decisions and powerful engines to execute them.

## T — Tech Stack

- **Backend:** Python, Flask
- **Video Processing:** FFmpeg
- **Source Discovery:** `yt-dlp`
- **AI Decision Making & Copywriting:** LLM7 (via API)
- **Subtitle Generation:** OpenAI's Whisper

---

## G — Getting Started

### Prerequisites

1.  **Python 3.10+**
2.  **FFmpeg:** You must have `ffmpeg` installed and available in your system's PATH.
    ```bash
    # On Debian/Ubuntu
    sudo apt update && sudo apt install ffmpeg
    ```
3.  **Git LFS:** Required to handle the sample media files.
    ```bash
    sudo apt update && sudo apt install git-lfs
    git lfs install
    ```

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd autonomous-ai-clipper
    ```

2.  **Create a virtual environment and install dependencies:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

### Configuration

1.  **LLM API Key:** For the system to use real AI for decision-making, you must set an environment variable with your API key.
    ```bash
    export LLM7_API_KEY="your_api_key_here"
    ```
    If this key is not set, the system will fall back to using mock (simulated) data for decisions and copywriting.

2.  **Content Keywords:** You can customize the content the system searches for by editing the `SEARCH_KEYWORDS` list in `src/config.py`.

---

## X — Execution

The system can be run in two ways: as an autonomous background service or via a web dashboard.

### 1. Running the Autonomous Loop Directly

This is the primary mode. The system will run continuously, discovering and processing videos.

```bash
python -m src.main
```
- To stop the system, press `Ctrl+C`.
- All activity is logged to `src/logs/clipper.log`.

### 2. Using the Web Dashboard

The web dashboard provides a user interface to monitor and control the clipper.

1.  **Start the Dashboard:**
    ```bash
    python -m src.dashboard.app
    ```
2.  **Access the UI:** Open your browser and navigate to `http://127.0.0.1:5001`.

From the dashboard, you can:
- **Start/Stop** the autonomous clipper loop.
- **View** a gallery of all completed jobs.
- **Watch** the final videos and review their generated captions.

---

## F — File Structure

-   `/output/`: Final, processed videos and metadata are stored here.
-   `/src/agents/`: Contains the AI "thinking" components (discovery, scoring, decision-making).
-   `/src/engines/`: Contains the "acting" components for video processing.
-   `/src/dashboard/`: Contains the Flask web application for monitoring and control.
-   `/src/assets/`: Contains sample media files for testing.
-   `/src/logs/`: Contains detailed logs of the system's activity.
-   `/src/config.py`: Central configuration for the entire system.
-   `/src/main.py`: The main entry point for the autonomous loop.
-   `/CHANGELOG.md`: A log of all major changes and new features.
