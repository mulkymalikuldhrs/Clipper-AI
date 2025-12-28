# src/main.py
import os
import time
import subprocess
import logging
import yt_dlp

from src.agents import source_agent, trend_agent, decision_agent, copy_agent
from src.engines import clip_engine, edit_engine, subtitle_engine, audio_engine
from src.utils import utils, notifications
import src.config

def process_video(source_video: dict, logger):
    """
    Handles the processing for a single approved video source.
    """
    job_id, job_dir = utils.create_job_directory()
    logger.info(f"Starting new job for source: '{source_video.get('title')}' (Job ID: {job_id})")

    try:
        # 1. Download the video
        logger.info("Downloading source video...")
        source_video_path = os.path.join(job_dir, 'source_video.mp4')
        ydl_opts = {'outtmpl': source_video_path, 'format': 'best', 'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([source_video['video_url']])

        if not os.path.exists(source_video_path) or os.path.getsize(source_video_path) == 0:
            raise FileNotFoundError("Downloaded video file is missing or empty.")

        # 2. Get AI Decision
        logger.info("--- Getting AI Decision ---")
        # Pass both source and scoring to the decision agent
        decision = decision_agent.get_llm_decision(source_video, source_video['score_result'])
        utils.save_json(decision, os.path.join(job_dir, 'decision.json'))

        # 3. Find Best Clip
        logger.info("--- Finding Best Clip ---")
        clip_times = clip_engine.find_best_clip(source_video_path, decision['clip_length'])
        utils.save_json(clip_times, os.path.join(job_dir, 'clip_times.json'))

        # 4. Apply Edits
        logger.info("--- Applying Edits ---")
        edited_clip_path = os.path.join(job_dir, 'edited_clip.mp4')
        edit_engine.apply_edits(source_video_path, edited_clip_path, clip_times['start'], clip_times['end'], decision['edit_style'])

        # 5. Generate Subtitles
        logger.info("--- Generating Subtitles ---")
        srt_path = os.path.join(job_dir, 'subtitle.srt')
        subtitle_engine.create_subtitles(edited_clip_path, srt_path)

        video_with_subs_path = os.path.join(job_dir, 'video_with_subs.mp4')
        subtitle_engine.burn_subtitles(edited_clip_path, srt_path, video_with_subs_path)

        # 6. Process Audio
        logger.info("--- Processing Audio ---")
        music_path = src.config.MUSIC_FILE_PATH
        final_video_path = os.path.join(job_dir, 'final_video.mp4')
        audio_engine.process_audio(video_with_subs_path, music_path, final_video_path)

        # 7. Generate Copy
        logger.info("--- Generating Copy ---")
        copy = copy_agent.generate_copy(source_video, decision)
        utils.save_json(copy, os.path.join(job_dir, 'caption.json'))

        logger.info(f"--- Workflow Complete for Job {job_id} ---")
        notifications.send_notification("Job Complete", f"Video generated in '{job_dir}'.", job_id)

    except Exception as e:
        logger.error(f"An error occurred during job {job_id}: {e}", exc_info=True)
        notifications.send_notification("Job Failed", f"Error processing '{source_video.get('title')}': {e}", job_id)


def main_loop():
    """
    The main autonomous loop for the AI Clipper.
    """
    logger = utils.setup_logging()
    logger.info("Autonomous AI Clipper started. Running in continuous loop.")

    while True:
        try:
            logger.info("--- Starting new discovery cycle ---")

            # 1. Discover Sources
            sources = source_agent.discover_sources()
            if not sources:
                logger.info("No new sources found in this cycle.")
            else:
                logger.info(f"Discovered {len(sources)} potential sources.")

            # 2. Score and Process Sources
            for source in sources:
                scoring_result = trend_agent.score_video(source)
                if scoring_result['approve']:
                    logger.info(f"Source '{source.get('title')}' approved with score {scoring_result['score']}. Starting processing.")
                    source['score_result'] = scoring_result # Attach score to the source object
                    process_video(source, logger)
                else:
                    logger.info(f"Source '{source.get('title')}' rejected with score {scoring_result['score']}.")

            # 3. Wait for the next cycle
            sleep_duration = 300 # 5 minutes
            logger.info(f"Discovery cycle complete. Waiting for {sleep_duration} seconds...")
            time.sleep(sleep_duration)

        except KeyboardInterrupt:
            logger.info("Shutting down Autonomous AI Clipper.")
            break
        except Exception as e:
            logger.critical(f"A critical error occurred in the main loop: {e}", exc_info=True)
            time.sleep(60) # Wait a minute before retrying on critical failure


if __name__ == '__main__':
    main_loop()
