# src/agents/trend_agent.py
import logging

HOOK_KEYWORDS = [
    "rahasia", "terbongkar", "jangan", "wajib", "cara", "mudah",
    "cepat", "viral", "terbukti", "ajaib", "shocking", "dream", "motivational"
]

def score_video(video_info: dict):
    """
    Scores a video based on its metadata. Adjusted for local testing.
    """
    score = 0.0

    duration = video_info.get("duration", 0)
    if 60 <= duration < 1200:
        score += 0.4

    title = video_info.get("title", "").lower()
    if any(keyword in title for keyword in HOOK_KEYWORDS):
        score += 0.5

    description = video_info.get("description", "")
    if len(description) < 1000:
        score += 0.1

    final_score = min(score, 1.0)

    # Approval threshold
    approve = final_score > 0.5

    logging.info(f"Scored video '{video_info.get('title')}': {final_score:.2f} -> {'Approved' if approve else 'Rejected'}")

    return {"score": round(final_score, 2), "approve": approve}

if __name__ == '__main__':
    test_video_approved = {
        "title": "Local Sample Video - Motivational",
        "duration": 60,
    }
    score_approved = score_video(test_video_approved)
    print(f"Approved Video Score: {score_approved}")
