const https = require('https');

https.get('https://linktot.net/api_timmap_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=https://example.com/1&url2=https://example.com/2', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('url&url2', data));
});

https.get('https://linktot.net/api_timmap_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url_chinh=https://example.com/1&url_phu=https://example.com/2', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('url_chinh&url_phu', data));
});
