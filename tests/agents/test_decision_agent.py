# tests/agents/test_decision_agent.py
import pytest
from src.agents import decision_agent

def test_get_llm_decision_high_score():
    """
    Tests that a high score results in a 'fast_zoom' editing decision.
    """
    video_info = {"title": "High Energy Video"}
    score = 0.8

    decision = decision_agent.get_llm_decision(video_info, score)

    assert decision["edit_style"] == "fast_zoom"
    assert decision["clip_length"] < 30
    assert decision["music"] == "motivational"

def test_get_llm_decision_low_score():
    """
    Tests that a low score results in a 'simple_cuts' editing decision.
    """
    video_info = {"title": "Calm and Relaxing Vlog"}
    score = 0.5

    decision = decision_agent.get_llm_decision(video_info, score)

    assert decision["edit_style"] == "simple_cuts"
    assert decision["clip_length"] >= 30
    assert decision["music"] == "ambient"

def test_get_llm_decision_structure():
    """
    Ensures the decision object always contains the required keys.
    """
    video_info = {"title": "Any Video"}
    score = 0.6

    decision = decision_agent.get_llm_decision(video_info, score)

    assert "clip_length" in decision
    assert "edit_style" in decision
    assert "subtitle" in decision
    assert "music" in decision
