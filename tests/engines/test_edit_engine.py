# tests/engines/test_edit_engine.py
import pytest
from unittest.mock import patch, MagicMock
from src.engines import edit_engine
from src import config

@patch('subprocess.run')
def test_apply_edits_fast_zoom(mock_run):
    """
    Tests that the 'fast_zoom' edit style correctly constructs the ffmpeg command.
    """
    # Arrange
    mock_run.return_value = MagicMock()

    # Act
    edit_engine.apply_edits(
        input_path=config.SAMPLE_VIDEO_PATH,
        output_path="test.mp4",
        start_time=10,
        end_time=30,
        edit_style="fast_zoom"
    )

    # Assert
    mock_run.assert_called_once()
    args, kwargs = mock_run.call_args
    ffmpeg_command = args[0]

    assert "zoompan" in ffmpeg_command[8]
    assert "crop=ih*9/16:ih,scale=1080:1920" in ffmpeg_command[8]
    assert ffmpeg_command[2] == "10"
    assert ffmpeg_command[4] == "30"
    assert ffmpeg_command[-1] == "test.mp4"


@patch('subprocess.run')
def test_apply_edits_simple_cuts(mock_run):
    """
    Tests that the 'simple_cuts' style does not include the zoompan filter.
    """
    # Arrange
    mock_run.return_value = MagicMock()

    # Act
    edit_engine.apply_edits(
        input_path=config.SAMPLE_VIDEO_PATH,
        output_path="test.mp4",
        start_time=0,
        end_time=20,
        edit_style="simple_cuts"
    )

    # Assert
    mock_run.assert_called_once()
    args, kwargs = mock_run.call_args
    ffmpeg_command = args[0]

    assert "zoompan" not in ffmpeg_command[8]
    assert "crop=ih*9/16:ih,scale=1080:1920" in ffmpeg_command[8]
    assert ffmpeg_command[-1] == "test.mp4"
