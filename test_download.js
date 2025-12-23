// Test script to verify the video download functionality
const http = require('http');

// Test YouTube URL (Rick Roll - short video)
const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

// Step 1: Test analyze endpoint
console.log('Step 1: Testing /api/analyze endpoint...');
const analyzePayload = JSON.stringify({ url: testUrl });

const analyzeOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(analyzePayload)
  }
};

const analyzeReq = http.request(analyzeOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response data:', data);
    
    if (res.statusCode === 200) {
      const responseObj = JSON.parse(data);
      console.log('\n✅ Analyze successful!');
      console.log('Video title:', responseObj.title);
      console.log('Available formats:', responseObj.formats.length);
      
      if (responseObj.formats.length > 0) {
        console.log('First format:', responseObj.formats[0]);
        
        // Step 2: Test download endpoint with first format
        console.log('\n\nStep 2: Testing /api/download endpoint...');
        const downloadPayload = JSON.stringify({ 
          url: testUrl,
          format_id: responseObj.formats[0].itag || responseObj.formats[0].format_id
        });

        const downloadOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/download',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(downloadPayload)
          }
        };

        const downloadReq = http.request(downloadOptions, (res2) => {
          let downloadData = '';

          res2.on('data', (chunk) => {
            downloadData += chunk;
          });

          res2.on('end', () => {
            console.log('Download response status:', res2.statusCode);
            console.log('Download response:', downloadData);
            
            if (res2.statusCode === 200) {
              console.log('\n✅ Download request successful!');
              console.log('Waiting for video to be saved...\n');
            }
          });
        });

        downloadReq.on('error', (error) => {
          console.error('Download request error:', error);
        });

        downloadReq.write(downloadPayload);
        downloadReq.end();
      }
    } else {
      console.log('❌ Analyze failed');
    }
  });
});

analyzeReq.on('error', (error) => {
  console.error('Analyze request error:', error);
  console.error('Make sure the server is running on localhost:3000');
});

analyzeReq.write(analyzePayload);
analyzeReq.end();
