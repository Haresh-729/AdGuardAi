import time
from functools import wraps

class RateLimiter:
    def __init__(self, calls_per_minute=10):
        self.calls_per_minute = calls_per_minute
        self.calls = []
    
    def wait_if_needed(self):
        """Wait if we're hitting rate limits"""
        now = time.time()
        # Remove calls older than 1 minute
        self.calls = [call_time for call_time in self.calls if now - call_time < 60]
        
        if len(self.calls) >= self.calls_per_minute:
            sleep_time = 60 - (now - self.calls[0])
            if sleep_time > 0:
                print(f"Rate limit protection: sleeping for {sleep_time:.1f} seconds")
                time.sleep(sleep_time)
        
        self.calls.append(now)

# Global rate limiter for Groq API
groq_rate_limiter = RateLimiter(calls_per_minute=8)  # Conservative limit

def rate_limited(func):
    """Decorator to apply rate limiting"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        groq_rate_limiter.wait_if_needed()
        return func(*args, **kwargs)
    return wrapper