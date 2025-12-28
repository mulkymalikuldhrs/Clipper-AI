# src/agents/copy_agent.py
import json
import logging

from src import config

def generate_copy(video_info: dict, edit_decision: dict):
    """
    Generates compelling copy (caption and hashtags) using an LLM.
    This is a MOCK function that simulates an API call to an LLM.
    """
    logging.info(f"Generating copy for video: {video_info.get('title')}")

    # Mocked response based on video title and edit style
    title = video_info.get("title", "")

    if "rahasia" in title.lower():
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

    logging.info(f"Generated Copy: {output}")

    return output

if __name__ == '__main__':
    test_video = {
        "title": "Rahasia Mindset Juara"
    }
    test_decision = {
        "edit_style": "fast_zoom"
    }

    copy_output = generate_copy(test_video, test_decision)
    print(json.dumps(copy_output, indent=2))

    # Example with different inputs
    test_video_2 = {"title": "Pelajaran Hidup"}
    test_decision_2 = {"edit_style": "simple_cuts"}
    copy_output_2 = generate_copy(test_video_2, test_decision_2)
    print("\n--- Another Example ---")
    print(json.dumps(copy_output_2, indent=2))
