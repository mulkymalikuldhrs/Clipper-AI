# tests/engines/test_audio_engine.py
import pytest
from unittest.mock import patch, MagicMock
from src.engines import audio_engine
from src import config

@patch('subprocess.run')
def test_process_audio_command_construction(mock_run):
    """
    Tests that the ffmpeg command for audio processing is constructed correctly.
    """
    # Arrange
    mock_run.return_value = MagicMock()

    # Act
    audio_engine.process_audio(
        input_video="input.mp4",
        music_path=config.MUSIC_FILE_PATH,
        output_video="output.mp4",
        music_volume=0.5
    )

    # Assert
    mock_run.assert_called_once()
    args, kwargs = mock_run.call_args
    ffmpeg_command = args[0]

    # Check for key components of the command
    assert ffmpeg_command[2] == "input.mp4"
    assert ffmpeg_command[4] == config.MUSIC_FILE_PATH
    assert "amix=inputs=2" in ffmpeg_command[6]
    assert "volume=0.5" in ffmpeg_command[6]
    assert ffmpeg_command[-1] == "output.mp4"
