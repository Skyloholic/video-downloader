const { execFile } = require('child_process');
const path = require('path');

// Check if yt-dlp is available
function isYtDlpAvailable() {
  return new Promise((resolve) => {
    execFile('yt-dlp', ['--version'], (error) => {
      resolve(!error);
    });
  });
}

// Get video info using yt-dlp
async function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    execFile('yt-dlp', [
      url,
      '--dump-json',
      '--no-warnings',
      '-q'
    ], (error, stdout) => {
      if (error) {
        reject(new Error('Failed to get video info. Make sure yt-dlp is installed: ' + error.message));
        return;
      }

      try {
        const info = JSON.parse(stdout);
        resolve(info);
      } catch (e) {
        reject(new Error('Failed to parse video info: ' + e.message));
      }
    });
  });
}

// Download video using yt-dlp
async function downloadVideo(url, outputTemplate) {
  return new Promise((resolve, reject) => {
    execFile('yt-dlp', [
      url,
      '-o',
      outputTemplate,
      '--no-warnings',
      '-q'
    ], (error, stdout) => {
      if (error) {
        reject(new Error('Download failed: ' + error.message));
        return;
      }
      resolve(stdout);
    });
  });
}

module.exports = {
  isYtDlpAvailable,
  getVideoInfo,
  downloadVideo
};
