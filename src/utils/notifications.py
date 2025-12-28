# src/utils/notifications.py
import logging
from src import config

# Get a logger instance
logger = logging.getLogger(__name__)

def send_notification(subject: str, message: str, job_id: str = None):
    """
    Sends a notification based on the configured service.
    """
    full_message = f"[{subject}]"
    if job_id:
        full_message += f" (Job ID: {job_id})"
    full_message += f": {message}"

    service = config.NOTIFICATION_SERVICE.lower()

    if service == "telegram":
        # Placeholder for Telegram integration
        # e.g., send_telegram_message(full_message)
        logger.info(f"TELEGRAM_STUB: {full_message}")
    elif service == "email":
        # Placeholder for email integration
        # e.g., send_email(subject, full_message)
        logger.info(f"EMAIL_STUB: {full_message}")
    elif service == "dashboard":
        # Placeholder for dashboard integration
        # e.g., update_dashboard(job_id, message)
        logger.info(f"DASHBOARD_STUB: {full_message}")
    elif service == "none":
        pass # No notification needed
    else: # Default to logging
        logger.info(f"NOTIFICATION: {full_message}")

if __name__ == '__main__':
    from src.utils.utils import setup_logging

    setup_logging()

    send_notification("Job Complete", "Successfully rendered video.", "test-123")
    send_notification("Job Failed", "Error during subtitle generation.", "test-456")

    # Test with a different service from config
    config.NOTIFICATION_SERVICE = "email"
    send_notification("Batch Summary", "10 videos processed.", None)
