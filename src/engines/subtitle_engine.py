# src/engines/subtitle_engine.py
import whisper
import logging
import os
import subprocess

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
            # Depending on the desired behavior, we might want to exit or raise
            raise

def generate_srt(text, start_time, end_time):
    """Formats a single transcription segment into SRT format."""
    def format_time(s):
        h = int(s / 3600)
        m = int((s % 3600) / 60)
        s_rem = s % 60
        return f"{h:02}:{m:02}:{s_rem:06.3f}".replace('.', ',')

    return f"1\n{format_time(start_time)} --> {format_time(end_time)}\n{text}\n\n"

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
                srt_file.write(f"{i + 1}\n")
                srt_file.write(f"{segment['start']:.3f} --> {segment['end']:.3f}\n")
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
        # To avoid ffmpeg errors, we can just copy the video
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

        if generated_srt:
            burn_subtitles(input_video, generated_srt, final_video)
            print(f"Check the final video: {final_video}")
