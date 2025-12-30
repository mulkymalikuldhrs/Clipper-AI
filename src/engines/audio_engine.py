# src/engines/audio_engine.py
import subprocess
import logging
import os
import sys

# Add project root to path for direct execution
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from src import config
from src.utils import utils

def process_audio(input_video: str, music_path: str, output_video: str, music_volume: float = 0.25):
    """
    Normalizes the video's audio and overlays background music.
    """
    utils.setup_logging()
    logging.info(f"Processing audio for '{input_video}'.")

    # This filter chain normalizes the main audio, adjusts the music volume, and mixes them.
    # The `strict -2` is needed for the aac encoder.
    command = [
        'ffmpeg',
        '-i', input_video,
        '-i', music_path,
        '-filter_complex', f"[0:a]loudnorm[a0]; [1:a]volume={music_volume}[a1]; [a0][a1]amix=inputs=2:duration=first[a]",
        '-map', '0:v',
        '-map', '[a]',
        '-c:v', 'copy',
        '-c:a', 'aac', '-strict', '-2',
        '-y',
        '-shortest',
        output_video
    ]

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        logging.info(f"Audio processing complete. Final video saved to '{output_video}'.")
        return output_video
    except subprocess.CalledProcessError as e:
        logging.error(f"Error during audio processing: {e.stderr}")
        return None

if __name__ == '__main__':
    # This block is for testing the audio engine directly.
    # It assumes that a test clip has been created by the other engines.
    input_video = "test_final_clip_with_subs.mp4"

    if not os.path.exists(input_video):
        print(f"Error: '{input_video}' not found. Please run the subtitle_engine test first.")
    else:
        output_video = "test_final_video_with_music.mp4"
        process_audio(input_video, config.MUSIC_FILE_PATH, output_video)
        print(f"Check the final video with music: {output_video}")
        # Clean up the test files
        os.remove(input_video)
        os.remove(output_video)
