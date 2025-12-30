# G — GLOBAL CONFIG

# LLM7 API Configuration
MODEL = "gpt-4.1-nano-2025-04-14"
BASE_URL = "https://api.llm7.io/v1"
API_KEY = "unused"  # As per document, but should be configurable

# Video Processing Configuration
VIDEO_RES = (1080, 1920)
FPS = 30
LANG = "ID"

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
