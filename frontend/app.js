 
/**
 * Custom Server for Non-Standalone Next.js Deployment
 * Use this when deploying full Next.js project (not standalone mode)
 */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const dev = false; // Always production on server
// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
console.log('Starting Next.js server...');
app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`> Mode: Non-Standalone (Full Next.js)`);
    });
}).catch((err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});
 