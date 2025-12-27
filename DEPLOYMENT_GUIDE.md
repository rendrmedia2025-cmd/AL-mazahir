# Al Mazahir Trading Est. - Deployment Guide

## 🚀 Quick Start - Local Server

### Option 1: Automated Deployment
```bash
# Run the automated deployment script
npm run deploy:local

# Start the production server
npm run start:local
```

### Option 2: Manual Steps
```bash
# 1. Install dependencies
npm ci

# 2. Build the application
npm run build

# 3. Install server dependencies
npm install express compression helmet dotenv

# 4. Start the production server
npm run server
```

## 🌐 Access Your Website

- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000
- **Health Check**: http://localhost:3000/health

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file with:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# EmailJS Configuration (Required for contact form)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
NEXT_PUBLIC_EMAILJS_AUTO_REPLY_TEMPLATE_ID=your_auto_reply_template_id_here
```

### EmailJS Setup
1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Create a service (Gmail, Outlook, etc.)
3. Create email templates
4. Get your Service ID, Template ID, and Public Key
5. Update the `.env.local` file

## 🐳 Docker Deployment

### Build and Run with Docker
```bash
# Build the Docker image
docker build -t almazahir-website .

# Run the container
docker run -p 3000:3000 --env-file .env.local almazahir-website
```

### Using Docker Compose
```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## 🌍 Production Deployment Options

### 1. Vercel (Recommended)
- Connect your GitHub repository
- Configure environment variables
- Automatic deployments on push

### 2. Netlify
- Build command: `npm run build`
- Publish directory: `.next`
- Configure environment variables

### 3. AWS/DigitalOcean/VPS
- Use the Docker setup
- Configure reverse proxy (Nginx)
- Set up SSL certificates

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-25T18:00:00.000Z",
  "version": "1.0.0"
}
```

### Performance Monitoring
- Built-in Core Web Vitals tracking
- Google Analytics integration ready
- Error boundary for graceful error handling

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CSP**: Content Security Policy
- **Compression**: Gzip compression
- **Static file caching**: Optimized asset delivery

## 🛠️ Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in .env.local
   PORT=3001
   ```

2. **Build fails**
   ```bash
   # Clear cache and rebuild
   rm -rf .next
   npm run build
   ```

3. **Contact form not working**
   - Check EmailJS configuration
   - Verify environment variables
   - Check browser console for errors

### Logs
- Development: Console output
- Production: Check server logs
- Docker: `docker-compose logs -f`

## 📱 Mobile Testing

Test on different devices:
- Desktop: Chrome, Firefox, Safari, Edge
- Mobile: iOS Safari, Android Chrome
- Tablet: iPad, Android tablets

## 🚀 Performance Optimization

The website includes:
- ✅ Image optimization (WebP/AVIF)
- ✅ Lazy loading
- ✅ Code splitting
- ✅ Static generation
- ✅ Compression
- ✅ Caching headers

## 📞 Support

For deployment issues:
1. Check the logs
2. Verify environment variables
3. Test the health endpoint
4. Review the troubleshooting section

---

**Al Mazahir Trading Est.** - Your trusted partner for industrial solutions