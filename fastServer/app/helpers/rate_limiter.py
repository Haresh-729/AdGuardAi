import time
from functools import wraps
from .api_key_pool import groq_pool

def rate_limited_with_pool(func):
    """Decorator with key pool rotation"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            key = groq_pool.get_available_key()
            
            if not key:
                print("All keys rate limited, waiting 10s...")
                time.sleep(10)
                retry_count += 1
                continue
            
            try:
                # Update the instance's API key
                if hasattr(args[0], 'groq_api_key'):
                    args[0].groq_api_key = key
                    # Recreate client with new key
                    import groq as groq_sdk
                    args[0].client = groq_sdk.Groq(api_key=key)
                
                return func(*args, **kwargs)
                
            except Exception as e:
                if "429" in str(e) or "rate" in str(e).lower():
                    # Extract retry-after if available
                    retry_after = 30  # default
                    groq_pool.mark_key_rate_limited(key, retry_after)
                    retry_count += 1
                    continue
                else:
                    raise e
        
        raise Exception("All API keys exhausted")
    
    return wrapper