# src/agents/copy_agent.py
import json
import logging
import requests
from src import config

def generate_copy(video_info: dict, edit_decision: dict):
    """
    Generates compelling copy (caption and hashtags) using a real LLM call, with a fallback.
    """
    logging.info(f"Generating copy for video: {video_info.get('title')}")

    if config.API_KEY == "unused":
        logging.warning("LLM7_API_KEY not set. Falling back to mock copy generation.")
        return get_mock_copy(video_info, edit_decision)

    prompt = f"""
    You are a social media expert. Generate a caption and hashtags for a short-form video clip.

    Video Title: "{video_info.get('title')}"
    Edit Style: "{edit_decision.get('edit_style')}"
    Niche: Motivation, Self-Improvement

    Generate a JSON object with the following structure:
    {{
      "caption": "<A short, engaging, and viral-style caption in Indonesian (Bahasa Indonesia).>",
      "hashtags": <A JSON array of 3-5 relevant hashtags in Indonesian, e.g., ["#motivasi", "#inspirasi"]>
    }}

    Return only the JSON object.
    """

    headers = {
        "Authorization": f"Bearer {config.API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": config.MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.8
    }

    try:
        response = requests.post(f"{config.BASE_URL}/chat/completions", headers=headers, json=data)
        response.raise_for_status()

        copy_str = response.json()['choices'][0]['message']['content']
        copy_output = json.loads(copy_str)

        logging.info(f"Generated Copy: {copy_output}")
        return copy_output

    except (requests.RequestException, json.JSONDecodeError, KeyError) as e:
        logging.error(f"LLM API call for copy generation failed: {e}. Falling back to mock logic.")
        return get_mock_copy(video_info, edit_decision)

def get_mock_copy(video_info: dict, edit_decision: dict):
    """
    Mock logic for generating copy, used as a fallback.
    """
    title = video_info.get("title", "").lower()

    if "rahasia" in title:
        caption = "Kalau ini kena, hidupmu berubah. #motivasi"
        hashtags = ["#motivasi", "#shorts", "#inspirasi"]
    elif edit_decision.get("edit_style") == "fast_zoom":
        caption = "Tonton sampai habis, ada pesan penting di akhir! 🔥"
        hashtags = ["#selfimprovement", "#mindset", "#success"]
    else:
        caption = "Sebuah pelajaran berharga dalam 60 detik."
        hashtags = ["#lifelessons", "#wisdom", "#shortvideo"]

    output = {
        "caption": caption,
        "hashtags": hashtags
    }
    logging.info(f"Mock Generated Copy: {output}")
    return output
