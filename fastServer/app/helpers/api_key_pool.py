import time
import threading
import os
from dotenv import load_dotenv

load_dotenv()

class APIKeyPool:
    def __init__(self):
        keys = [
            os.getenv('GROQ_API_KEY'),
            os.getenv('GROQ_API_KEY_2'), 
            os.getenv('GROQ_API_KEY_3'),
            os.getenv('GROQ_API_KEY_4')
        ]
        self.keys = [k for k in keys if k]
        self.key_status = {key: {"available": True, "reset_time": 0, "last_used": 0} for key in self.keys}  # Added last_used
        self.lock = threading.Lock()
        self.min_interval = 15.0  # 1 second between requests per key
    
    def get_key_with_retry(self):
        with self.lock:
            current_time = time.time()
            
            # Reset expired keys
            for key in self.key_status:
                if not self.key_status[key]["available"] and current_time >= self.key_status[key]["reset_time"]:
                    self.key_status[key]["available"] = True
            
            # Find available key that hasn't been used recently
            for key in self.keys:
                if (self.key_status[key]["available"] and 
                    current_time - self.key_status[key]["last_used"] >= self.min_interval):
                    self.key_status[key]["last_used"] = current_time  # Mark as used
                    return key
            return None
    
    def mark_rate_limited(self, key, retry_after=60):
        with self.lock:
            self.key_status[key]["available"] = False
            self.key_status[key]["reset_time"] = time.time() + retry_after

groq_pool = APIKeyPool()