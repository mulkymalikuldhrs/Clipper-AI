# tests/engines/test_subtitle_engine.py
import pytest
from unittest.mock import patch, MagicMock
from src.engines import subtitle_engine
from src import config
import os

@patch('whisper.load_model')
def test_create_subtitles_success(mock_load_model):
    """
    Tests that the subtitle engine correctly transcribes and formats the SRT file.
    """
    # Arrange
    subtitle_engine._model = None # Reset the model to ensure it's re-mocked
    mock_transcribe = MagicMock(return_value={
        "segments": [
            {"start": 1.0, "end": 3.0, "text": "Hello world."},
            {"start": 4.5, "end": 6.0, "text": "This is a test."},
        ]
    })
    mock_model = MagicMock()
    mock_model.transcribe = mock_transcribe
    mock_load_model.return_value = mock_model

    output_srt_path = "test_output.srt"

    # Act
    result_path = subtitle_engine.create_subtitles(config.SAMPLE_VIDEO_PATH, output_srt_path)

    # Assert
    assert result_path == output_srt_path
    with open(output_srt_path, 'r') as f:
        content = f.read()
        assert "1\n00:00:01,000 --> 00:00:03,000\nHello world.\n\n" in content
        assert "2\n00:00:04,500 --> 00:00:06,000\nThis is a test.\n\n" in content

    os.remove(output_srt_path)

@patch('subprocess.run')
def test_burn_subtitles(mock_run):
    """
    Tests that the subtitle burning command is constructed correctly.
    """
    # Arrange
    mock_run.return_value = MagicMock()
    srt_path = "test.srt"
    with open(srt_path, 'w') as f:
        f.write("A test subtitle") # Ensure the file is not empty

    # Act
    subtitle_engine.burn_subtitles(config.SAMPLE_VIDEO_PATH, srt_path, "output.mp4")

    # Assert
    mock_run.assert_called_once()
    args, kwargs = mock_run.call_args
    ffmpeg_command = args[0]

    assert f"subtitles={srt_path}:force_style=" in ffmpeg_command[4]
    os.remove(srt_path)


@patch('subprocess.run')
def test_burn_subtitles_empty_srt(mock_run):
    """
    Tests that the subtitle burning is skipped if the SRT file is empty.
    """
    # Arrange
    srt_path = "empty.srt"
    open(srt_path, 'w').close()

    # Act
    subtitle_engine.burn_subtitles(config.SAMPLE_VIDEO_PATH, srt_path, "output.mp4")

    # Assert: Check that ffmpeg was NOT called, but the copy was
    mock_run.assert_called_once_with(['cp', config.SAMPLE_VIDEO_PATH, 'output.mp4'])
    os.remove(srt_path)
