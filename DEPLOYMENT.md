# Vercel Deployment Guide

## 📋 Prerequisites

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

## 🚀 Deployment Steps

### Step 1: Prepare Environment Variables

1. **Copy your backend `.env` file variables to Vercel:**
   - Go to your Vercel dashboard
   - Create a new project or select existing
   - Go to Settings → Environment Variables
   - Add these variables:
     ```
     MONGO_URI=<your-mongodb-connection-string>
     JWT_ACCESS_SECRET=<your-jwt-secret>
     JWT_REFRESH_SECRET=<your-refresh-secret>
     CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
     CLOUDINARY_API_KEY=<your-cloudinary-key>
     CLOUDINARY_API_SECRET=<your-cloudinary-secret>
     NODE_ENV=production
     ```

### Step 2: Initial Deployment

1. **From your project root directory:**
   ```bash
   # First time deployment
   vercel
   
   # Follow the prompts:
   # ? Set up and deploy "~/path/to/Excel-Analytics-Platform"? [Y/n] y
   # ? Which scope do you want to deploy to? [Your Account]
   # ? Link to existing project? [y/N] n
   # ? What's your project's name? excel-analytics-platform
   # ? In which directory is your code located? ./
   ```

2. **The CLI will detect your `vercel.json` and deploy both frontend and backend**

### Step 3: Production Deployment

```bash
# Deploy to production
vercel --prod
```

## 🔧 Local Development

### Start Development Servers:

```bash
# Option 1: Start both servers together (from root)
npm run dev

# Option 2: Start individually
npm run dev:backend    # Starts backend on http://192.168.1.21:3001
npm run dev:frontend   # Starts frontend on http://192.168.1.21:5173
```

### Test API Connection:
```bash
# Test backend health
curl http://192.168.1.21:3001/api/health

# Test frontend
open http://192.168.1.21:5173
```

## 🌐 URLs After Deployment

- **Production Frontend:** `https://your-app-name.vercel.app`
- **Production API:** `https://your-app-name.vercel.app/api/*`
- **Local Frontend:** `http://192.168.1.21:5173`
- **Local API:** `http://192.168.1.21:3001/api/*`

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Check that your Vercel domain is in the CORS allowlist
   - Verify environment variables are set correctly

2. **API Routes Not Working:**
   - Ensure `vercel.json` routes are configured correctly
   - Check function logs in Vercel dashboard

3. **Environment Variables:**
   - Verify all required environment variables are set in Vercel dashboard
   - Check that variable names match exactly

### Debugging Commands:

```bash
# Check deployment status
vercel ls

# View function logs
vercel logs <deployment-url>

# Test production build locally
npm run build
npm run preview
```

## 📁 Project Structure

```
Excel-Analytics-Platform/
├── vercel.json                 # Vercel configuration
├── package.json               # Root workspace config
├── frontend/
│   ├── dist/                  # Build output (generated)
│   ├── src/utils/api.js       # API configuration with environment detection
│   ├── .env.development       # Local development variables
│   ├── .env.production        # Production variables
│   └── package.json           # Frontend dependencies & scripts
├── backend/
│   ├── index.js               # Main server file (serverless-ready)
│   └── package.json           # Backend dependencies & scripts
└── .vercelignore              # Files to exclude from deployment
```

## 🔄 Redeployment

For future deployments:

```bash
# Quick deployment to preview
vercel

# Deploy to production
vercel --prod

# Deploy with custom domain
vercel --prod --target production
```

## 🎯 Production Checklist

- [ ] Environment variables configured in Vercel dashboard
- [ ] CORS allows your Vercel domain
- [ ] Database connection string is correct for production
- [ ] Cloudinary credentials are set
- [ ] JWT secrets are configured
- [ ] Frontend builds successfully (`npm run build`)
- [ ] API routes work in production
- [ ] No console errors in browser
