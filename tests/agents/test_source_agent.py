# tests/agents/test_source_agent.py
import pytest
from unittest.mock import MagicMock, patch, call
from src.agents import source_agent
from src import config

@patch('yt_dlp.YoutubeDL')
def test_discover_sources_success(mock_youtube_dl):
    """
    Tests that the source agent correctly processes a successful API response
    using the new search-then-detail logic.
    """
    # Arrange: Configure the mock for the multi-step discovery process

    # 1. Mock the initial search result
    mock_search_results = {
        'entries': [
            {'url': 'https://www.youtube.com/watch?v=test_video_1'},
            {'url': 'https://www.youtube.com/watch?v=test_video_2'}
        ]
    }

    # 2. Mock the detailed info for each video
    mock_detailed_info_1 = {
        "webpage_url": "https://www.youtube.com/watch?v=test_video_1",
        "title": "Test Motivational Video 1",
        "duration": 300
    }
    mock_detailed_info_2 = {
        "webpage_url": "https://www.youtube.com/watch?v=test_video_2",
        "title": "Test Motivational Video 2",
        "duration": 180 # Suitable duration
    }

    # This mock will be used for the inner 'ydl_detail' context manager
    mock_detail_instance = MagicMock()
    mock_detail_instance.extract_info.side_effect = [mock_detailed_info_1, mock_detailed_info_2]

    # This mock will be used for the outer 'ydl' context manager
    mock_search_instance = MagicMock()
    mock_search_instance.extract_info.return_value = mock_search_results

    # The main mock object needs to handle being used in two nested 'with' statements
    mock_youtube_dl.return_value.__enter__.side_effect = [mock_search_instance, mock_detail_instance, mock_detail_instance]

    # Temporarily use a single keyword for predictable testing
    original_keywords = config.SEARCH_KEYWORDS
    config.SEARCH_KEYWORDS = ["test"]

    # Act
    discovered_videos = source_agent.discover_sources()

    # Assert
    assert len(discovered_videos) == 2
    assert discovered_videos[0]['title'] == "Test Motivational Video 1"
    assert discovered_videos[1]['duration'] == 180

    # Restore original config
    config.SEARCH_KEYWORDS = original_keywords


@patch('yt_dlp.YoutubeDL')
def test_discover_sources_failure(mock_youtube_dl):
    """
    Tests that the source agent handles a failed search call gracefully.
    """
    # Arrange: Configure the mock to raise an exception during the search
    mock_search_instance = MagicMock()
    mock_search_instance.extract_info.side_effect = Exception("API Search Error")
    mock_youtube_dl.return_value.__enter__.return_value = mock_search_instance

    config.SEARCH_KEYWORDS = ["test"]

    # Act
    discovered_videos = source_agent.discover_sources()

    # Assert
    assert len(discovered_videos) == 0
