# src/agents/source_agent.py
import yt_dlp
import logging
from src import config

def discover_sources():
    """
    Discovers video sources from YouTube by searching for configured keywords.
    """
    if not config.SEARCH_KEYWORDS:
        logging.warning("No search keywords configured. Skipping source discovery.")
        return []

    ydl_opts = {
        'quiet': True,
        'format': 'best',
        'noplaylist': True,
        'default_search': 'ytsearch5',  # Search for 5 videos per keyword
        'extract_flat': 'in_playlist' # Extract only metadata, not full video info
    }

    discovered_videos = []
    logging.info(f"Discovering videos for keywords: {config.SEARCH_KEYWORDS}")

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        for keyword in config.SEARCH_KEYWORDS:
            try:
                # Search for videos
                search_result = ydl.extract_info(f"ytsearch:{keyword}", download=False)

                if 'entries' in search_result and search_result['entries']:
                    for video_info_flat in search_result['entries']:
                        # Now, get detailed info for each video individually
                        with yt_dlp.YoutubeDL({'quiet': True, 'noplaylist': True}) as ydl_detail:
                            detailed_info = ydl_detail.extract_info(video_info_flat['url'], download=False)

                            # Filter out videos that are too short or too long to be useful
                            duration = detailed_info.get("duration", 0)
                            if not (60 < duration < 3600): # 1 min to 1 hour
                                logging.info(f"Skipping video '{detailed_info.get('title')}' due to unsuitable duration ({duration}s).")
                                continue

                            discovered_videos.append({
                                "video_url": detailed_info.get("webpage_url"),
                                "title": detailed_info.get("title"),
                                "description": detailed_info.get("description"),
                                "duration": duration,
                                "language": detailed_info.get("language", "id")
                            })
                            logging.info(f"Discovered: {detailed_info.get('title')}")

            except Exception as e:
                logging.error(f"Error discovering videos for keyword '{keyword}': {e}")

    # Remove duplicates
    unique_videos = list({v['video_url']: v for v in discovered_videos}.values())
    logging.info(f"Discovered {len(unique_videos)} unique videos in total.")
    return unique_videos
