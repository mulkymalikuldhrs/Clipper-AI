# src/main.py
import os
import time
import subprocess
import logging
import yt_dlp
import shutil

from src.agents import source_agent, trend_agent, decision_agent, copy_agent
from src.engines import clip_engine, edit_engine, subtitle_engine, audio_engine
from src.utils import utils, notifications
import src.config

def process_video(source_video: dict, logger, is_local: bool = False):
    """
    Handles the processing for a single approved video source.
    """
    job_id, job_dir = utils.create_job_directory()
    logger.info(f"Starting new job for source: '{source_video.get('title')}' (Job ID: {job_id})")

    try:
        if is_local:
            source_video_path = src.config.SAMPLE_VIDEO_PATH
            if not os.path.exists(source_video_path):
                raise FileNotFoundError(f"Sample video not found at '{source_video_path}'")
        else:
            logger.info("Downloading source video...")
            source_video_path = os.path.join(job_dir, 'source_video.mp4')
            ydl_opts = {'outtmpl': source_video_path, 'format': 'best', 'quiet': True}
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([source_video['video_url']])
            if not os.path.exists(source_video_path) or os.path.getsize(source_video_path) == 0:
                raise FileNotFoundError("Downloaded video file is missing or empty.")

        logger.info("--- Getting AI Decision ---")
        decision = decision_agent.get_llm_decision(source_video, source_video.get('score_result', {}).get('score', 1.0))
        utils.save_json(decision, os.path.join(job_dir, 'decision.json'))

        logger.info("--- Finding Best Clip ---")
        clip_times = clip_engine.find_best_clip(source_video_path, decision['clip_length'])
        if not clip_times: raise ValueError("Failed to find a suitable clip.")
        utils.save_json(clip_times, os.path.join(job_dir, 'clip_times.json'))

        logger.info("--- Applying Edits ---")
        edited_clip_path = os.path.join(job_dir, 'edited_clip.mp4')
        if not edit_engine.apply_edits(source_video_path, edited_clip_path, clip_times['start'], clip_times['end'], decision['edit_style']):
            raise ValueError("Failed to apply edits.")

        logger.info("--- Generating Subtitles ---")
        srt_path = os.path.join(job_dir, 'subtitle.srt')
        if not subtitle_engine.create_subtitles(edited_clip_path, srt_path):
            raise ValueError("Failed to generate subtitles.")

        video_with_subs_path = os.path.join(job_dir, 'video_with_subs.mp4')
        if not subtitle_engine.burn_subtitles(edited_clip_path, srt_path, video_with_subs_path):
            raise ValueError("Failed to burn subtitles.")

        logger.info("--- Processing Audio ---")
        music_path = src.config.MUSIC_FILE_PATH
        final_video_path = os.path.join(job_dir, 'final_video.mp4')
        if not audio_engine.process_audio(video_with_subs_path, music_path, final_video_path):
            raise ValueError("Failed to process audio.")

        logger.info("--- Generating Copy ---")
        copy = copy_agent.generate_copy(source_video, decision)
        utils.save_json(copy, os.path.join(job_dir, 'caption.json'))

        logger.info(f"--- Workflow Complete for Job {job_id} ---")
        notifications.send_notification("Job Complete", f"Video generated in '{job_dir}'.", job_id)

    except Exception as e:
        logger.error(f"An error occurred during job {job_id}: {e}", exc_info=True)
        notifications.send_notification("Job Failed", f"Error processing '{source_video.get('title')}': {e}", job_id)

    finally:
        output_dir = "output"
        os.makedirs(output_dir, exist_ok=True)
        for asset in ['final_video.mp4', 'caption.json', 'subtitle.srt']:
            src_path = os.path.join(job_dir, asset)
            if os.path.exists(src_path):
                shutil.move(src_path, os.path.join(output_dir, f"{job_id}_{asset}"))
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir)

def main_loop():
    logger = utils.setup_logging()
    subtitle_engine._load_model()

    if src.config.LOCAL_VERIFICATION_MODE:
        logger.info("Running in LOCAL VERIFICATION MODE. Processing one local video.")
        source = {"title": "Local Sample Video for Verification", "duration": 60, "video_url": ""}
        process_video(source, logger, is_local=True)
        logger.info("Local verification run complete.")
        return

    logger.info("Autonomous AI Clipper started. Running in continuous loop.")
    while True:
        try:
            logger.info("--- Starting new discovery cycle ---")
            sources = source_agent.discover_sources()
            if not sources:
                logger.info("No new sources found.")
            else:
                logger.info(f"Discovered {len(sources)} potential sources.")

            for source in sources:
                scoring_result = trend_agent.score_video(source)
                if scoring_result['approve']:
                    logger.info(f"Source '{source.get('title')}' approved with score {scoring_result['score']}. Starting processing.")
                    source['score_result'] = scoring_result
                    process_video(source, logger)
                else:
                    logger.info(f"Source '{source.get('title')}' rejected with score {scoring_result['score']}.")

            sleep_duration = src.config.SLEEP_DURATION
            logger.info(f"Discovery cycle complete. Waiting for {sleep_duration} seconds...")
            time.sleep(sleep_duration)

        except KeyboardInterrupt:
            logger.info("Shutting down Autonomous AI Clipper.")
            break
        except Exception as e:
            logger.critical(f"A critical error occurred in the main loop: {e}", exc_info=True)
            time.sleep(60)

if __name__ == '__main__':
    main_loop()
