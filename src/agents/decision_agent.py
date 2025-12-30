# src/agents/decision_agent.py
import json
import logging
import requests
from src import config

def get_llm_decision(video_info: dict, score_result: dict):
    """
    Makes editing decisions using a real LLM call, with a fallback to mock logic.
    """
    logging.info(f"Making decision for video: {video_info.get('title')}")

    # Fallback to mock logic if the API key is not configured
    if config.API_KEY == "unused":
        logging.warning("LLM7_API_KEY not set. Falling back to mock decision logic.")
        return get_mock_decision(video_info, score_result.get('score', 0))

    # Construct a detailed prompt for the LLM
    prompt = f"""
    Analyze the following video metadata and decide on the editing style for a short-form clip (TikTok/Reels).

    Video Title: "{video_info.get('title')}"
    Video Description: "{video_info.get('description', 'N/A')}"
    Video Duration (seconds): {video_info.get('duration')}
    Content Score (0.0 to 1.0): {score_result.get('score')}

    Based on this, provide a JSON object with the following structure:
    {{
      "clip_length": <integer, between 15 and 45 seconds>,
      "edit_style": <"fast_zoom" for high-energy content, "simple_cuts" for calmer content>,
      "subtitle": <boolean, always true>,
      "music": <"motivational" or "ambient">
    }}

    Return only the JSON object, nothing else.
    """

    headers = {
        "Authorization": f"Bearer {config.API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": config.MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }

    try:
        response = requests.post(f"{config.BASE_URL}/chat/completions", headers=headers, json=data)
        response.raise_for_status()

        # Extract the JSON content from the response
        decision_str = response.json()['choices'][0]['message']['content']
        decision = json.loads(decision_str)

        logging.info(f"LLM Decision: {decision}")
        return decision

    except (requests.RequestException, json.JSONDecodeError, KeyError) as e:
        logging.error(f"LLM API call failed: {e}. Falling back to mock decision logic.")
        return get_mock_decision(video_info, score_result.get('score', 0))

def get_mock_decision(video_info: dict, score: float):
    """
    Mock logic for making editing decisions, used as a fallback.
    """
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
    logging.info(f"Mock Decision: {decision}")
    return decision
