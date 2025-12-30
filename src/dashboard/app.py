# src/dashboard/app.py
import os
import json
from flask import Flask, render_template, send_from_directory
from threading import Thread
import sys

# Add project root to path to allow importing 'src'
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from src.main import main_loop

# --- Configuration ---
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "output")

app = Flask(__name__)

# --- State Management (Simple) ---
# In a production system, this would be a more robust state manager (e.g., Redis)
clipper_thread = None
clipper_status = "Stopped"

def start_clipper_thread():
    """Starts the main AI clipper loop in a background thread."""
    global clipper_status
    if clipper_thread is None or not clipper_thread.is_alive():
        thread = Thread(target=main_loop, daemon=True)
        thread.start()
        clipper_status = "Running"
        return "Clipper started successfully."
    return "Clipper is already running."

def stop_clipper_thread():
    """Stops the AI clipper loop (simulated by just updating status for now)."""
    global clipper_status
    # In a real system, you'd need a proper mechanism to signal the thread to stop.
    # For this version, we'll just update the status. The thread will exit on its own.
    clipper_status = "Stopped"
    return "Clipper stop signal sent. It will halt after the current cycle."


def get_job_data():
    """Scans the output directory to get information about completed jobs."""
    jobs = []
    if not os.path.exists(OUTPUT_DIR):
        return jobs

    for filename in sorted(os.listdir(OUTPUT_DIR), reverse=True):
        if filename.endswith("_final_video.mp4"):
            job_id = filename.replace("_final_video.mp4", "")

            job_info = {"job_id": job_id, "video_path": f"/output/{filename}"}

            caption_path = os.path.join(OUTPUT_DIR, f"{job_id}_caption.json")
            if os.path.exists(caption_path):
                with open(caption_path, 'r', encoding='utf-8') as f:
                    job_info["caption"] = json.load(f)

            jobs.append(job_info)
    return jobs

# --- Routes ---

@app.route('/')
def index():
    """Main dashboard page."""
    jobs = get_job_data()
    return render_template('index.html', jobs=jobs, status=clipper_status)

@app.route('/output/<filename>')
def serve_output_file(filename):
    """Serves the generated video files."""
    return send_from_directory(OUTPUT_DIR, filename)

@app.route('/start', methods=['POST'])
def start_clipper():
    """Endpoint to start the clipper."""
    message = start_clipper_thread()
    return message, 200

@app.route('/stop', methods=['POST'])
def stop_clipper():
    """Endpoint to stop the clipper."""
    message = stop_clipper_thread()
    return message, 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
