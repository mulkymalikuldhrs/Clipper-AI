# src/agents/source_agent.py
import yt_dlp
import logging

def discover_sources(keywords: list = None, channel_list: list = None, rss_feeds: list = None):
    """
    Discovers video sources from a predefined list of URLs.
    This is a more reliable method for testing than YouTube search.
    """
    predefined_urls = [
        "https://www.youtube.com/watch?v=g-jwWYX7Jlo", # Creative Commons motivational video
        "https://www.youtube.com/watch?v=k6_G5-1frlo", # Another CC video
    ]

    ydl_opts = {
        'quiet': True,
        'format': 'best',
        'noplaylist': True,
    }

    discovered_videos = []
    logging.info(f"Discovering videos from predefined list.")

    for video_url in predefined_urls:
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                detailed_info = ydl.extract_info(video_url, download=False)
                discovered_videos.append({
                    "video_url": detailed_info.get("webpage_url"),
                    "title": detailed_info.get("title"),
                    "description": detailed_info.get("description"),
                    "duration": detailed_info.get("duration"),
                    "language": detailed_info.get("language", "id")
                })
                logging.info(f"Discovered: {detailed_info.get('title')}")
        except Exception as e:
            logging.error(f"Error discovering video '{video_url}': {e}")

    return discovered_videos

if __name__ == '__main__':
    videos = discover_sources()
    for video in videos:
        print(video)
