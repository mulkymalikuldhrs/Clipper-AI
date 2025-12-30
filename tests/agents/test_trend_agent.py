# tests/agents/test_trend_agent.py
import pytest
from src.agents import trend_agent

def test_score_video_approved_high_score():
    """
    Tests a video that should be approved with a high score.
    """
    video_info = {
        "title": "Viral Secrets Uncovered!",
        "duration": 300,
        "description": "Short and punchy."
    }
    result = trend_agent.score_video(video_info)
    assert result["approve"] is True
    assert result["score"] > 0.8

def test_score_video_rejected_low_score():
    """
    Tests a video that should be rejected due to multiple factors.
    """
    video_info = {
        "title": "My Holiday Vlog",
        "duration": 2000, # Too long
        "description": "A very long description that goes on and on..." * 10
    }
    result = trend_agent.score_video(video_info)
    assert result["approve"] is False
    assert result["score"] < 0.5

def test_score_video_boundary_duration():
    """
    Tests the scoring at the edge of the duration limits.
    """
    video_info_just_right = {"title": "Good", "duration": 61}
    video_info_too_short = {"title": "Bad", "duration": 59}

    result_good = trend_agent.score_video(video_info_just_right)
    result_bad = trend_agent.score_video(video_info_too_short)

    assert result_good["score"] > result_bad["score"]

def test_score_video_hook_keywords():
    """
    Tests that titles with hook keywords receive a significant score boost.
    """
    video_with_hook = {"title": "The secret to success is revealed!", "duration": 120}
    video_without_hook = {"title": "A talk about success", "duration": 120}

    score_with_hook = trend_agent.score_video(video_with_hook)["score"]
    score_without_hook = trend_agent.score_video(video_without_hook)["score"]

    assert score_with_hook > score_without_hook
