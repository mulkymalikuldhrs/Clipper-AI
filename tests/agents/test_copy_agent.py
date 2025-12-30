# tests/agents/test_copy_agent.py
import pytest
from src.agents import copy_agent

def test_generate_copy_with_secret_keyword():
    """
    Tests that a title containing 'rahasia' (secret) gets a specific, high-impact caption.
    """
    video_info = {"title": "Rahasia Tersembunyi di Balik Sukses"}
    edit_decision = {"edit_style": "simple_cuts"}

    copy = copy_agent.generate_copy(video_info, edit_decision)

    assert "hidupmu berubah" in copy["caption"]
    assert "#motivasi" in copy["hashtags"]

def test_generate_copy_with_fast_zoom_style():
    """
    Tests that the 'fast_zoom' edit style results in an energetic caption.
    """
    video_info = {"title": "Video Motivasi Keren"}
    edit_decision = {"edit_style": "fast_zoom"}

    copy = copy_agent.generate_copy(video_info, edit_decision)

    assert "Tonton sampai habis" in copy["caption"]
    assert "#success" in copy["hashtags"]

def test_generate_copy_default_case():
    """
    Tests the default caption generation for a standard video.
    """
    video_info = {"title": "Pelajaran Hidup yang Berharga"}
    edit_decision = {"edit_style": "simple_cuts"}

    copy = copy_agent.generate_copy(video_info, edit_decision)

    assert "pelajaran berharga" in copy["caption"]
    assert "#lifelessons" in copy["hashtags"]

def test_generate_copy_structure():
    """
    Ensures the copy object always contains the 'caption' and 'hashtags' keys.
    """
    video_info = {"title": "Any Video"}
    edit_decision = {"edit_style": "any_style"}

    copy = copy_agent.generate_copy(video_info, edit_decision)

    assert "caption" in copy
    assert "hashtags" in copy
    assert isinstance(copy["hashtags"], list)
