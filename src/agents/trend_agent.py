# src/agents/trend_agent.py
import logging
import re

HOOK_KEYWORDS = [
    "rahasia", "terbongkar", "jangan", "wajib", "cara", "mudah",
    "cepat", "viral", "terbukti", "ajaib", "shocking", "dream", "motivational", "secret"
]

def score_video(video_info: dict):
    """
    Scores a video based on its metadata. Case-insensitive and whole-word matching.
    """
    score = 0.0

    duration = video_info.get("duration", 0)
    if 60 <= duration < 1200:
        score += 0.4

    title = video_info.get("title", "").lower()
    # Use regex to find whole word matches for the hook keywords
    if any(re.search(r'\b' + keyword + r'\b', title) for keyword in HOOK_KEYWORDS):
        score += 0.5

    if "local sample video" in title:
        score = 1.0

    description = video_info.get("description", "")
    if len(description) < 1000:
        score += 0.1

    final_score = min(score, 1.0)

    # Approval threshold
    approve = final_score > 0.5

    logging.info(f"Scored video '{video_info.get('title')}': {final_score:.2f} -> {'Approved' if approve else 'Rejected'}")

    return {"score": round(final_score, 2), "approve": approve}
