#!/usr/bin/env python3
"""
yt-dlp helper script for Node.js backend
Requires: pip install yt-dlp
"""
import sys
import json
import subprocess
import time

def get_video_info(url):
    """Get video information in JSON format"""
    try:
        # Build command with proper headers and options
        cmd = [
            'yt-dlp',
            '--dump-json',
            '-q',
            '--socket-timeout', '30',
            '--js-runtime', 'node',  # Enable Node.js runtime for YouTube
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--add-header', 'Accept-Language:en-US,en;q=0.9',
            '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            '--no-check-certificates',  # Disable SSL verification if needed
            '--cookies-from-browser', 'chrome',  # Try to use Chrome cookies for YouTube
            url
        ]
        
        # Add referer for Pinterest
        if 'pinterest' in url.lower():
            cmd.extend(['--add-header', 'Referer:https://www.pinterest.com/'])
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            # Retry once on failure
            time.sleep(2)
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                return json.loads(result.stdout)
            print(json.dumps({'error': result.stderr}), file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

def download_video(url, output_path):
    """Download video to specified path"""
    try:
        cmd = [
            'yt-dlp',
            '-o', output_path,
            '-q',
            '--socket-timeout', '30',
            '--js-runtime', 'node',  # Enable Node.js runtime for YouTube
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--add-header', 'Accept-Language:en-US,en;q=0.9',
            '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            '--no-check-certificates',  # Disable SSL verification if needed
            '--cookies-from-browser', 'chrome',  # Try to use Chrome cookies for YouTube
            url
        ]
        
        if 'pinterest' in url.lower():
            cmd.extend(['--add-header', 'Referer:https://www.pinterest.com/'])
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout
        )
        if result.returncode == 0:
            return {'success': True}
        else:
            return {'error': result.stderr}
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Missing arguments'}), file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'info':
        if len(sys.argv) < 3:
            print(json.dumps({'error': 'Missing URL'}), file=sys.stderr)
            sys.exit(1)
        url = sys.argv[2]
        info = get_video_info(url)
        print(json.dumps(info))
    
    elif command == 'download':
        if len(sys.argv) < 4:
            print(json.dumps({'error': 'Missing URL or output path'}), file=sys.stderr)
            sys.exit(1)
        url = sys.argv[2]
        output_path = sys.argv[3]
        result = download_video(url, output_path)
        print(json.dumps(result))
    
    else:
        print(json.dumps({'error': 'Unknown command'}), file=sys.stderr)
        sys.exit(1)
