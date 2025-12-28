# src/engines/edit_engine.py
import subprocess
import logging
import sys
import os

# Add project root to path for direct execution
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from src import config
from src.utils import utils
from src.engines import clip_engine


def apply_edits(input_path: str, output_path: str, start_time: float, end_time: float, edit_style: str = "simple_cuts", target_resolution: tuple = (1080, 1920)):
    """
    Applies a set of edits to a video clip.
    """
    utils.setup_logging()
    logging.info(f"Applying '{edit_style}' edits to clip from '{input_path}'.")

    duration = end_time - start_time
    width, height = target_resolution

    video_filters = [
        f"crop=ih*9/16:ih,scale={width}:{height}", # Crop to 9:16 aspect ratio and scale
    ]

    if edit_style == "fast_zoom":
        # Apply a subtle zoom-in effect across the clip
        video_filters.append(f"zoompan=z='min(zoom+0.001,1.5)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={width}x{height}")

    # In a more advanced version, we could add jump cuts, speed ramps etc.

    command = [
        'ffmpeg',
        '-ss', str(start_time),
        '-to', str(end_time),
        '-i', input_path,
        '-vf', ",".join(video_filters),
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-c:a', 'aac',
        '-y',
        output_path
    ]

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        logging.info(f"Successfully edited video saved to '{output_path}'.")
        return output_path
    except subprocess.CalledProcessError as e:
        logging.error(f"Error during video editing: {e.stderr}")
        return None

if __name__ == '__main__':
    clip_times = clip_engine.find_best_clip(config.SAMPLE_VIDEO_PATH)
    if clip_times:
        output_file = "test_edited_clip.mp4"
        apply_edits(
            config.SAMPLE_VIDEO_PATH,
            output_file,
            start_time=clip_times['start'],
            end_time=clip_times['end'],
            edit_style="fast_zoom"
        )
        print(f"Check the output file: {output_file}")
