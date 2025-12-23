const express = require('express');
const cors = require('cors');
const path = require('path');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files (static files from parent directory)
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes

// Analyze endpoint - Returns available formats for a video URL
app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    if (!isValidURL(url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check if it's a YouTube URL
    if (ytdl.validateURL(url)) {
      try {
        const info = await ytdl.getInfo(url);
        const formats = info.formats
          .filter(f => f.hasVideo || f.hasAudio)
          .map(f => ({
            format_id: f.itag,
            resolution: f.qualityLabel || 'audio',
            ext: f.container,
            filesize: f.contentLength ? `${Math.round(f.contentLength / 1024 / 1024)}MB` : 'Unknown'
          }))
          .filter((f, i, arr) => arr.findIndex(x => x.resolution === f.resolution) === i); // Remove duplicates

        res.json({
          title: info.videoDetails.title,
          duration: info.videoDetails.lengthSeconds,
          thumbnail: info.videoDetails.thumbnail.thumbnails[0].url,
          formats: formats.slice(0, 10) // Limit to 10 formats
        });
      } catch (error) {
        console.error('ytdl error:', error.message);
        res.status(400).json({ error: 'Failed to fetch video info. Video may be private or unavailable.' });
      }
    } else {
      // For non-YouTube URLs, return a generic message
      res.status(400).json({ error: 'Currently only YouTube videos are supported' });
    }
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze video' });
  }
});

// Download endpoint - Returns download URL for selected format
app.post('/api/download', async (req, res) => {
  try {
    const { url, format_id } = req.body;

    if (!url || !format_id) {
      return res.status(400).json({ error: 'URL and format_id are required' });
    }

    if (ytdl.validateURL(url)) {
      try {
        const info = await ytdl.getInfo(url);
        const format = info.formats.find(f => String(f.itag) === String(format_id));

        if (!format) {
          return res.status(400).json({ error: 'Format not found' });
        }

        // Return download URL
        res.json({
          url: format.url,
          filename: `${info.videoDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format.container}`,
          size: format.contentLength ? `${Math.round(format.contentLength / 1024 / 1024)}MB` : 'Unknown'
        });
      } catch (error) {
        console.error('Download error:', error.message);
        res.status(400).json({ error: 'Failed to get download link' });
      }
    } else {
      res.status(400).json({ error: 'Currently only YouTube videos are supported' });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download video' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend available at http://localhost:${PORT}`);
});

// Helper function to validate URL
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
