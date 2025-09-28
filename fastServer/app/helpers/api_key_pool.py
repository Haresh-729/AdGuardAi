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
        self.key_status = {key: {"available": True, "reset_time": 0} for key in self.keys}
        self.lock = threading.Lock()
    
    def get_key_with_retry(self):
        with self.lock:
            # Reset expired keys
            current_time = time.time()
            for key in self.key_status:
                if not self.key_status[key]["available"] and current_time >= self.key_status[key]["reset_time"]:
                    self.key_status[key]["available"] = True
            
            # Return available key
            for key in self.keys:
                if self.key_status[key]["available"]:
                    return key
            return None
    
    def mark_rate_limited(self, key, retry_after=60):
        with self.lock:
            self.key_status[key]["available"] = False
            self.key_status[key]["reset_time"] = time.time() + retry_after

groq_pool = APIKeyPool()