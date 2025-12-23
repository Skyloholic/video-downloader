const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files (static files from parent directory)
app.use(express.static(path.join(__dirname, '../frontend')));

// Try to use ytdl-core with better error handling
let ytdl;
try {
  ytdl = require('@distube/ytdl-core');
} catch (e) {
  console.log('distube/ytdl-core not available, trying ytdl-core');
  try {
    ytdl = require('ytdl-core');
  } catch (e2) {
    console.log('ytdl-core also not available');
  }
}

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

    // Check if YouTube URL
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return res.status(400).json({ error: 'Only YouTube videos are supported' });
    }

    if (!ytdl || !ytdl.validateURL) {
      return res.status(500).json({ error: 'Video downloader not available' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
      console.log('Getting info for:', url);
      const info = await ytdl.getInfo(url);
      console.log('Got info:', info.videoDetails.title);
      
      const formats = info.formats
        .filter(f => f.hasVideo || f.hasAudio)
        .map(f => ({
          format_id: String(f.itag || f.quality),
          resolution: f.qualityLabel || f.quality || 'audio',
          ext: f.mimeType ? f.mimeType.split('/')[1].split(';')[0] : 'mp4',
          filesize: f.contentLength ? `${Math.round(f.contentLength / 1024 / 1024)}MB` : 'Unknown',
          itag: f.itag
        }))
        .filter((f, i, arr) => arr.findIndex(x => x.resolution === f.resolution) === i);

      res.json({
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url || '',
        formats: formats.slice(0, 15)
      });
    } catch (error) {
      console.error('Error fetching video info:', error.message);
      res.status(400).json({ error: 'Failed to fetch video info. Video may be unavailable or private.' });
    }
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Download endpoint
app.post('/api/download', async (req, res) => {
  try {
    const { url, format_id } = req.body;
    console.log('Download request for:', url, 'format:', format_id);

    if (!url || !format_id) {
      return res.status(400).json({ error: 'URL and format_id are required' });
    }

    // Check if YouTube URL
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return res.status(400).json({ error: 'Only YouTube videos are supported' });
    }

    if (!ytdl || !ytdl.validateURL) {
      return res.status(500).json({ error: 'Video downloader not available' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
      const info = await ytdl.getInfo(url);
      const format = info.formats.find(f => String(f.itag) === String(format_id));

      if (!format) {
        return res.status(400).json({ error: 'Format not found' });
      }

      const ext = format.mimeType ? format.mimeType.split('/')[1].split(';')[0] : 'mp4';
      const filename = `${info.videoDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;

      res.json({
        url: format.url,
        filename: filename,
        size: format.contentLength ? `${Math.round(format.contentLength / 1024 / 1024)}MB` : 'Unknown'
      });
    } catch (error) {
      console.error('Download error:', error.message);
      res.status(400).json({ error: 'Failed to get download link' });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend available at http://localhost:${PORT}`);
  if (ytdl) {
    console.log('✅ Video downloader is available');
  } else {
    console.log('⚠️ Video downloader not loaded');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend available at http://localhost:${PORT}`);
  if (ytdl) {
    console.log('✅ Video downloader is available');
  } else {
    console.log('⚠️ Video downloader not loaded');
  }
});
