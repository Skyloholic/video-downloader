const express = require('express');
const cors = require('cors');
const path = require('path');

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

    // TODO: Integrate with yt-dlp or similar library to get video info
    // For now, returning mock data structure that your frontend expects
    const mockFormats = {
      title: 'Sample Video Title',
      duration: 300,
      thumbnail: 'https://via.placeholder.com/320x180',
      formats: [
        { format_id: '18', resolution: '360p', ext: 'mp4', filesize: '10MB' },
        { format_id: '22', resolution: '720p', ext: 'mp4', filesize: '25MB' },
        { format_id: '137', resolution: '1080p', ext: 'mp4', filesize: '50MB' },
        { format_id: '251', resolution: 'audio', ext: 'mp3', filesize: '5MB' },
      ]
    };

    res.json(mockFormats);
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

    // TODO: Integrate with yt-dlp to download video and generate download link
    // For now, returning mock response
    const mockDownloadUrl = `https://example.com/downloads/video_${Date.now()}.mp4`;

    res.json({ 
      url: mockDownloadUrl,
      filename: 'video_download.mp4',
      size: '25MB'
    });
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
