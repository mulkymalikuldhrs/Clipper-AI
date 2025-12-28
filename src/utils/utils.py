# src/utils/utils.py
import os
import logging
import json
from uuid import uuid4

def setup_logging(log_dir="src/logs"):
    """
    Sets up a centralized logger that outputs to both console and a file.
    """
    log_filename = os.path.join(log_dir, "clipper.log")
    os.makedirs(log_dir, exist_ok=True)

    # Get the root logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Clear existing handlers
    if logger.hasHandlers():
        logger.handlers.clear()

    # Create handlers
    console_handler = logging.StreamHandler()
    file_handler = logging.FileHandler(log_filename)

    # Create formatters
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    # Add handlers to the logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger

def create_job_directory(base_output_dir="src/output"):
    """
    Creates a unique directory for a new job.
    """
    job_id = str(uuid4())
    job_dir = os.path.join(base_output_dir, job_id)
    os.makedirs(job_dir, exist_ok=True)
    return job_id, job_dir

def save_json(data, path):
    """
    Saves a dictionary to a JSON file.
    """
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

if __name__ == '__main__':
    # Example usage
    logger = setup_logging()
    logger.info("This is an informational message.")
    logger.warning("This is a warning.")

    job_id, job_dir = create_job_directory()
    logger.info(f"Created new job directory: {job_dir}")

    my_data = {"key": "value", "status": "testing"}
    save_json(my_data, os.path.join(job_dir, "test.json"))
    logger.info("Saved test JSON file.")
