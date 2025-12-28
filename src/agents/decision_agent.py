# src/agents/decision_agent.py
import json
import logging

from src import config

def get_llm_decision(video_info: dict, score: float):
    """
    Makes editing decisions using an LLM.
    This is a MOCK function that simulates an API call to an LLM.
    """
    logging.info(f"Making decision for video: {video_info.get('title')}")

    # In a real implementation, this would involve formatting a prompt and sending it
    # to an API endpoint defined in config.BASE_URL with config.API_KEY.
    # e.g., requests.post(config.BASE_URL, headers=..., json=...)

    # Mocked response based on score and video properties
    if score > 0.7:
        decision = {
            "clip_length": 22,
            "edit_style": "fast_zoom",
            "subtitle": True,
            "music": "motivational"
        }
    else:
        decision = {
            "clip_length": 30,
            "edit_style": "simple_cuts",
            "subtitle": True,
            "music": "ambient"
        }

    logging.info(f"LLM Decision: {decision}")

    # The output should be a JSON object as specified in the document
    return decision

if __name__ == '__main__':
    # Example usage
    test_video = {
        "title": "Rahasia Sukses Terbongkar!",
        "duration": 300
    }

    high_score = 0.8
    low_score = 0.5

    print("Decision for high-scoring video:")
    decision_high = get_llm_decision(test_video, high_score)
    print(json.dumps(decision_high, indent=2))

    print("\nDecision for low-scoring video:")
    decision_low = get_llm_decision(test_video, low_score)
    print(json.dumps(decision_low, indent=2))
