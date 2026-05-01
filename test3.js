const http = require('node:http');

http.get('http://localhost:5173/api/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    try {
      const json = JSON.parse(data);
      console.log('JSON success:', json.success);
      console.log('Products count:', json.products ? json.products.length : 0);
    } catch(e) {
      console.log('Parse error:', e.message);
      console.log('Raw output:', data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.log('Request error:', err.message);
});
