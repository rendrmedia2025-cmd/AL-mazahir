/**
 * Production server for Al Mazahir Trading Est. website
 * Serves the built Next.js application with proper headers and optimizations
 */

const express = require('express');
const next = require('next');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.prepare().then(() => {
  const server = express();

  // Security headers
  server.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
        connectSrc: ["'self'", "https://api.emailjs.com"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));

  // Compression
  server.use(compression());

  // Static file caching
  server.use('/images', express.static(path.join(__dirname, 'public/images'), {
    maxAge: '1y',
    etag: true
  }));

  server.use('/_next/static', express.static(path.join(__dirname, '.next/static'), {
    maxAge: '1y',
    etag: true
  }));

  // Health check endpoint
  server.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Handle all other requests with Next.js
  server.get('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, HOST, (err) => {
    if (err) throw err;
    console.log(`🚀 Al Mazahir Trading Est. server ready!`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://${HOST}:${PORT}`);
    console.log(`🏭 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});