# G — GLOBAL CONFIG
import os

# LLM7 API Configuration
MODEL = "gpt-4.1-nano-2025-04-14"
BASE_URL = "https://api.llm7.io/v1"
# Load API key from environment variable for security
API_KEY = os.getenv("LLM7_API_KEY", "unused")

# Video Processing Configuration
VIDEO_RES = (1080, 1920)
FPS = 30
LANG = "ID"

# Content Discovery
# Keywords for the source_agent to search for on YouTube
SEARCH_KEYWORDS = ["motivasi", "inspirasi", "sukses", "mindset", "produktif"]


# Output Quality Standards
OUTPUT_RESOLUTION = "1080x1920"
OUTPUT_DURATION_MIN = 15
OUTPUT_DURATION_MAX = 45
SUBTITLE_CONTRAST = "high"
AUDIO_NORMALIZATION = "clear"

# System Configuration
MAX_RETRY = 3
LOG_LEVEL = "INFO"
NOTIFICATION_SERVICE = "telegram" # 'email', 'dashboard', 'none'
SLEEP_DURATION = 300 # 5 minutes
LOCAL_VERIFICATION_MODE = False # Set to True to run a single cycle with local files

# File Paths
ASSETS_DIR = "src/assets"
SAMPLE_VIDEO_PATH = "src/assets/sample_video.mp4"
MUSIC_FILE_PATH = "src/assets/motivational-music.mp3"
