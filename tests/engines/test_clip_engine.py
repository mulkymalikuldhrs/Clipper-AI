# tests/engines/test_clip_engine.py
import pytest
from unittest.mock import patch, MagicMock
from src.engines import clip_engine
from src import config

@patch('subprocess.run')
def test_find_best_clip_no_silence(mock_run):
    """
    Tests the fallback mechanism when no silence is detected in the video.
    """
    # Arrange: Mock an empty stderr output from ffmpeg
    mock_run.return_value = MagicMock(stderr="")

    # Act: Call the function under test
    clip = clip_engine.find_best_clip(config.SAMPLE_VIDEO_PATH, desired_length=20)

    # Assert: Check that the function returns the first 20 seconds as a fallback
    assert clip["start"] == 0
    assert clip["end"] == 20
