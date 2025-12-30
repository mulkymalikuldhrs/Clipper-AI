# src/engines/subtitle_engine.py
import whisper
import logging
import os
import subprocess
import sys

# Global variable to hold the loaded Whisper model
_model = None

def _load_model():
    """Loads the Whisper model into memory if it hasn't been loaded yet."""
    global _model
    if _model is None:
        logging.info("Loading Whisper model 'tiny' for the first time.")
        try:
            _model = whisper.load_model("tiny")
            logging.info("Whisper model loaded successfully.")
        except Exception as e:
            logging.critical(f"Failed to load Whisper model: {e}", exc_info=True)
            raise

def generate_srt_timestamp(seconds):
    """Formats seconds into SRT timestamp format HH:MM:SS,ms."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds = seconds % 60
    return f"{hours:02}:{minutes:02}:{seconds:06.3f}".replace('.', ',')

def create_subtitles(video_path: str, output_srt_path: str):
    """
    Generates subtitles for a video using the pre-loaded Whisper model.
    """
    logging.info(f"Generating subtitles for '{video_path}'.")

    try:
        _load_model() # Ensure the model is loaded
        result = _model.transcribe(video_path)

        if not result["segments"]:
            logging.warning(f"Whisper could not transcribe any speech from '{video_path}'. SRT file will be empty.")
            open(output_srt_path, 'w').close()
            return output_srt_path

        with open(output_srt_path, "w", encoding="utf-8") as srt_file:
            for i, segment in enumerate(result["segments"]):
                start_time = generate_srt_timestamp(segment['start'])
                end_time = generate_srt_timestamp(segment['end'])
                srt_file.write(f"{i + 1}\n")
                srt_file.write(f"{start_time} --> {end_time}\n")
                srt_file.write(f"{segment['text'].strip()}\n\n")

        logging.info(f"Subtitles saved to '{output_srt_path}'.")
        return output_srt_path
    except Exception as e:
        logging.error(f"Error during subtitle generation: {e}")
        return None

def burn_subtitles(video_path: str, srt_path: str, output_path: str):
    """
    Burns subtitles onto a video file.
    """
    if not os.path.exists(srt_path) or os.path.getsize(srt_path) == 0:
        logging.warning("SRT file is empty or does not exist. Skipping subtitle burning.")
        if video_path != output_path:
            subprocess.run(['cp', video_path, output_path])
        return output_path

    logging.info(f"Burning subtitles from '{srt_path}' onto '{video_path}'.")

    subtitle_style = "Alignment=10,Fontname=Arial,Fontsize=18,PrimaryColour=&H00FFFFFF,Bold=1,Outline=1,Shadow=1"

    command = [
        'ffmpeg',
        '-i', video_path,
        '-vf', f"subtitles={srt_path}:force_style='{subtitle_style}'",
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-c:a', 'copy',
        '-y',
        output_path
    ]

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        logging.info(f"Video with burned subtitles saved to '{output_path}'.")
        return output_path
    except subprocess.CalledProcessError as e:
        logging.error(f"Error burning subtitles: {e.stderr}")
        return None

if __name__ == '__main__':
    # Add project root to path for direct execution
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    from src.utils import utils
    from src import config

    utils.setup_logging()

    input_video = config.SAMPLE_VIDEO_PATH
    srt_file = "test_output.srt"
    final_video = "test_final_clip_with_subs.mp4"

    if not os.path.exists(input_video):
        print(f"Error: The file '{input_video}' does not exist.")
    else:
        generated_srt = create_subtitles(input_video, srt_file)

        if generated_srt and os.path.getsize(generated_srt) > 0:
            burn_subtitles(input_video, generated_srt, final_video)
            print(f"Check the final video: {final_video}")
            # Clean up the test files
            os.remove(srt_file)
            os.remove(final_video)
        else:
            print("Subtitle generation failed or produced an empty file.")
