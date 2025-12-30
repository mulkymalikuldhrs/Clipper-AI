# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-12-30

### Added
- **Real LLM Integration:** Replaced mock responses in `decision_agent` and `copy_agent` with live API calls to an LLM. Includes a fallback to mock data if the API key is not configured.
- **Dynamic Content Discovery:** Upgraded `source_agent` to discover content by searching YouTube for keywords defined in `config.py`, replacing the previous hardcoded URL list.
- **Web Dashboard:** Added a Flask-based web dashboard (`src/dashboard/app.py`) for monitoring and control.
  - View system status (Running/Stopped).
  - Start and stop the autonomous clipper loop.
  - View a gallery of completed video jobs with their captions and hashtags.
- **Comprehensive Unit Tests:** Added a full suite of `pytest` unit tests for all agents and engines, using mocking to isolate components.
- **Robust Error Handling:** The main orchestrator now checks the return value of each processing step and gracefully handles failures in individual jobs.
- **Configuration & Documentation:**
  - Added `LOCAL_VERIFICATION_MODE` to `config.py` to allow for stable, predictable test runs.
  - Created this `CHANGELOG.md`.
  - Extensively updated `README.md` with instructions for API key configuration, running the web dashboard, and understanding the dual-mode operation.

### Changed
- **Dependency Pinning:** Pinned the `openai-whisper` dependency to a specific commit hash for build stability.
- **SRT Timestamp Format:** Corrected the timestamp format in `subtitle_engine.py` to be compliant with the SRT standard (`HH:MM:SS,ms`).
- **File Organization:** Moved final output files to a top-level `output/` directory for easier access and added cleanup for intermediate files.

### Fixed
- Fixed a persistent bug in the `clip_engine`'s clip centering logic.
- Resolved various import path issues by adopting a module-based execution approach (`python -m src.main`).
