# tests/agents/test_source_agent.py
import pytest
from unittest.mock import MagicMock, patch
from src.agents import source_agent

@patch('yt_dlp.YoutubeDL')
def test_discover_sources_success(mock_youtube_dl):
    """
    Tests that the source agent correctly processes a successful API response.
    """
    # Arrange: Configure the mock to return a predictable, valid response
    mock_instance = MagicMock()
    mock_instance.extract_info.return_value = {
        "webpage_url": "https://www.youtube.com/watch?v=test_video",
        "title": "Test Motivational Video",
        "description": "A great video for testing.",
        "duration": 300,
        "language": "en"
    }
    mock_youtube_dl.return_value.__enter__.return_value = mock_instance

    # Act: Call the function under test
    discovered_videos = source_agent.discover_sources()

    # Assert: Check that the output is what we expect
    assert len(discovered_videos) > 0
    first_video = discovered_videos[0]
    assert first_video["title"] == "Test Motivational Video"
    assert first_video["duration"] == 300
    assert "video_url" in first_video

@patch('yt_dlp.YoutubeDL')
def test_discover_sources_failure(mock_youtube_dl):
    """
    Tests that the source agent handles a failed API call gracefully.
    """
    # Arrange: Configure the mock to raise an exception
    mock_instance = MagicMock()
    mock_instance.extract_info.side_effect = Exception("API Error")
    mock_youtube_dl.return_value.__enter__.return_value = mock_instance

    # Act: Call the function under test
    discovered_videos = source_agent.discover_sources()

    # Assert: Check that the function returns an empty list as expected
    assert len(discovered_videos) == 0
