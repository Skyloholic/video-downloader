const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Helper function to spawn Python with fallback to python3
function spawnPython(args) {
  try {
    return spawn('python', args);
  } catch {
    return spawn('python3', args);
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files (static files from parent directory)
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes

// Analyze endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    console.log('Analyze request for:', url);

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Check if it's a valid URL
    try {
      new URL(url);
    } catch (_) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Use Python yt-dlp helper for all platforms
    try {
      const info = await new Promise((resolve, reject) => {
        const python = spawnPython([path.join(__dirname, 'yt_dlp_helper.py'), 'info', url]);
        let output = '';
        let error = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          error += data.toString();
        });

        python.on('close', (code) => {
          if (code === 0) {
            try {
              resolve(JSON.parse(output));
            } catch (e) {
              reject(new Error('Failed to parse video info'));
            }
          } else {
            reject(new Error(error || 'Failed to fetch video info'));
          }
        });

        python.on('error', (err) => {
          reject(new Error('yt-dlp not available. Install with: pip install yt-dlp'));
        });
      });

      const formats = [];
      if (info.formats) {
        info.formats.forEach(f => {
          if ((f.vcodec && f.vcodec !== 'none') || (f.acodec && f.acodec !== 'none')) {
            formats.push({
              format_id: f.format_id || String(f.format),
              resolution: f.format || 'unknown',
              height: f.height || 0,
              ext: f.ext || 'mp4',
              filesize: f.filesize || null,
              vcodec: f.vcodec,
              acodec: f.acodec
            });
          }
        });
      }

      res.json({
        title: info.title || 'Unknown Title',
        duration: info.duration || 0,
        thumbnail: info.thumbnail || (info.thumbnails && info.thumbnails[0]?.url) || '',
        formats: formats.slice(0, 20)
      });
    } catch (error) {
      console.error('Error fetching video info:', error.message);
      res.status(400).json({ error: 'Failed to fetch video info. ' + error.message });
    }
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Download endpoint - streams directly to browser
app.post('/api/download', async (req, res) => {
  try {
    const { url, format_id } = req.body;
    console.log('Download request for:', url, 'format:', format_id);

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      // Use yt-dlp to stream video directly to response
      const python = spawnPython([
        '-m', 'yt_dlp',
        '-f', format_id,
        '-o', '-',  // Output to stdout
        url
      ]);

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Transfer-Encoding', 'chunked');

      let isHeadersSent = false;

      python.stdout.on('data', (chunk) => {
        if (!isHeadersSent) {
          // Headers already sent by default
          isHeadersSent = true;
        }
        res.write(chunk);
      });

      python.stderr.on('data', (data) => {
        console.error('yt-dlp error:', data.toString());
        if (!isHeadersSent) {
          res.status(500).json({ error: 'Download failed: ' + data.toString() });
        }
      });

      python.on('close', (code) => {
        if (code === 0) {
          console.log('Video streamed successfully');
          res.end();
        } else if (!isHeadersSent) {
          res.status(500).json({ error: 'Download failed with code ' + code });
        } else {
          res.end();
        }
      });

      python.on('error', (err) => {
        console.error('Process error:', err);
        if (!isHeadersSent) {
          res.status(500).json({ error: 'yt-dlp not available: ' + err.message });
        }
      });

    } catch (error) {
      console.error('Download error:', error.message);
      res.status(400).json({ error: 'Failed to download: ' + error.message });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Health check with yt-dlp verification
app.get('/api/health', async (req, res) => {
  try {
    // Check if yt-dlp is available
    const ytdlpCheck = await new Promise((resolve) => {
      const python = spawnPython(['-m', 'yt_dlp', '--version']);
      let output = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.on('close', (code) => {
        resolve(code === 0 ? output.trim() : 'not found');
      });
      
      python.on('error', () => {
        resolve('not found');
      });
    });

    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      ytdlp: ytdlpCheck
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend available at http://localhost:${PORT}`);
  console.log('ℹ️ Make sure yt-dlp is installed: pip install yt-dlp');
  console.log('✅ Multi-platform video downloader ready!');
});
