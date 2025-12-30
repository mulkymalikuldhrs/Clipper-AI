# src/engines/clip_engine.py
import subprocess
import logging
import json
import sys
import os

# Add project root to path for direct execution
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from src import config
from src.utils import utils

def find_best_clip(video_path: str, desired_length: int = 20, silence_threshold: str = "-30dB", silence_duration: float = 1.0):
    """
    Finds the best clip from a video by identifying the longest segment of continuous speech/activity.
    """
    utils.setup_logging()
    logging.info(f"Finding best clip in '{video_path}' with desired length ~{desired_length}s.")

    # 1. Use ffmpeg's silencedetect filter to find non-silent parts
    command = [
        'ffmpeg', '-i', video_path,
        '-af', f"silencedetect=noise={silence_threshold}:d={silence_duration}",
        '-f', 'null', '-'
    ]

    result = subprocess.run(command, capture_output=True, text=True)
    stderr_output = result.stderr

    # 2. Parse the output to get timestamps
    silence_starts = []
    silence_ends = []
    for line in stderr_output.split('\n'):
        if "silence_start" in line:
            start_time = float(line.split('silence_start: ')[1])
            silence_starts.append(start_time)
        elif "silence_end" in line:
            end_time = float(line.split('silence_end: ')[1].split(' |')[0])
            silence_ends.append(end_time)

    if not silence_ends:
        logging.warning("No silence detected. The video might be all action or music.")
        # Fallback: return the first `desired_length` seconds
        return {"start": 0, "end": desired_length}

    # 3. Determine the longest non-silent segment
    # Assume video starts with sound
    speech_segments = []
    last_end = 0.0
    for start in silence_starts:
        speech_segments.append((last_end, start))
        # Find the corresponding silence_end to update the last_end
        for end in silence_ends:
            if end > start:
                last_end = end
                break

    # Get video duration to handle speech at the very end
    duration_command = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', video_path]
    try:
        duration = float(subprocess.check_output(duration_command).strip())
        if last_end < duration:
            speech_segments.append((last_end, duration))
    except Exception as e:
        logging.error(f"Could not get video duration: {e}")
        duration = None

    if not speech_segments:
        logging.error("Could not determine any speech segments.")
        return None

    # 4. Find the longest segment and select a clip from it
    longest_segment = max(speech_segments, key=lambda seg: seg[1] - seg[0])
    segment_duration = longest_segment[1] - longest_segment[0]

    start_time = longest_segment[0]

    # Center the clip if the segment is longer than desired
    if segment_duration > desired_length:
        mid_point = longest_segment[0] + segment_duration / 2
        start_time = mid_point - (desired_length / 2)

    end_time = start_time + desired_length

    logging.info(f"Selected clip from {start_time:.2f}s to {end_time:.2f}s.")

    return {"start": round(start_time, 2), "end": round(end_time, 2)}


if __name__ == '__main__':
    # This block is for testing the clip engine directly.
    # It will not produce any output files.
    clip = find_best_clip(config.SAMPLE_VIDEO_PATH, desired_length=22)
    if clip:
        print(json.dumps(clip, indent=2))
