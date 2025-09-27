import os
import requests
import tempfile
from typing import List, Optional
from urllib.parse import urlparse
import uuid

class MediaDownloader:
    def __init__(self, temp_dir: Optional[str] = None):
        self.temp_dir = temp_dir or tempfile.mkdtemp()
        os.makedirs(self.temp_dir, exist_ok=True)
    
    def download_file(self, url: str, file_extension: Optional[str] = None) -> str:
        """Download a file from URL and return local path"""
        try:
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            # Generate unique filename
            if not file_extension:
                parsed_url = urlparse(url)
                file_extension = os.path.splitext(parsed_url.path)[1] or '.tmp'
            
            filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(self.temp_dir, filename)
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Downloaded: {url} -> {file_path}")
            return file_path
            
        except Exception as e:
            print(f"Error downloading {url}: {str(e)}")
            raise Exception(f"Failed to download file from {url}: {str(e)}")
    
    def download_images(self, urls: List[str]) -> List[str]:
        """Download multiple images"""
        local_paths = []
        for url in urls:
            try:
                path = self.download_file(url, '.jpg')
                local_paths.append(path)
            except Exception as e:
                print(f"Failed to download image {url}: {str(e)}")
                continue
        return local_paths
    
    def download_videos(self, urls: List[str]) -> List[str]:
        """Download multiple videos"""
        local_paths = []
        for url in urls:
            try:
                path = self.download_file(url, '.mp4')
                local_paths.append(path)
            except Exception as e:
                print(f"Failed to download video {url}: {str(e)}")
                continue
        return local_paths
    
    def download_audios(self, urls: List[str]) -> List[str]:
        """Download multiple audio files"""
        local_paths = []
        for url in urls:
            try:
                path = self.download_file(url, '.mp3')
                local_paths.append(path)
            except Exception as e:
                print(f"Failed to download audio {url}: {str(e)}")
                continue
        return local_paths
    
    def cleanup(self):
        """Clean up downloaded files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir)
            print(f"Cleaned up temporary directory: {self.temp_dir}")
        except Exception as e:
            print(f"Error cleaning up: {str(e)}")