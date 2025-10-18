# 🚀 Nefol Application - Client Sharing Guide

## Quick Start (Recommended)

### Option 1: Using ngrok (Easiest)
1. **Run the sharing script:**
   ```bash
   # For PowerShell
   .\scripts\share-app.ps1 -Panel user
   
   # For Command Prompt
   .\scripts\share-app.bat
   ```

2. **Share the URL:** Copy the HTTPS URL from the ngrok window and send it to your client.

### Option 2: Manual ngrok
1. **Start your application:**
   ```bash
   pnpm dev:user  # For user panel
   pnpm dev:admin # For admin panel
   ```

2. **In a new terminal, create tunnel:**
   ```bash
   ngrok http 5173  # For user panel
   ngrok http 5174  # For admin panel
   ```

3. **Share the HTTPS URL** from ngrok with your client.

## Production Deployment Options

### Option 1: Vercel (Recommended for React apps)
1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy user panel:**
   ```bash
   cd user-panel
   vercel --prod
   ```

3. **Deploy admin panel:**
   ```bash
   cd admin-panel
   vercel --prod
   ```

### Option 2: Netlify
1. **Build the application:**
   ```bash
   pnpm build:user
   pnpm build:admin
   ```

2. **Drag and drop** the `dist` folder to [netlify.com/drop](https://netlify.com/drop)

### Option 3: GitHub Pages
1. **Build and push to GitHub**
2. **Enable GitHub Pages** in repository settings
3. **Set source to** `gh-pages` branch

## Backend Deployment

### Option 1: Railway
1. **Connect your GitHub repository**
2. **Railway will auto-deploy** your backend

### Option 2: Render
1. **Create a new Web Service**
2. **Connect your repository**
3. **Set build command:** `cd backend && npm install && npm run build`
4. **Set start command:** `cd backend && npm start`

## Client Access Instructions

### For Development/Demo (ngrok)
- **URL:** `https://your-random-id.ngrok.io`
- **Note:** URL changes each time you restart ngrok
- **Duration:** Free tier has session limits

### For Production
- **User Panel:** `https://your-app.vercel.app`
- **Admin Panel:** `https://your-admin-app.vercel.app`
- **Backend API:** `https://your-api.railway.app`

## Troubleshooting

### Common Issues

1. **"ngrok not found"**
   ```bash
   npm install -g ngrok
   ```

2. **"Port already in use"**
   ```bash
   # Kill process on port 5173
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

3. **"Build failed"**
   ```bash
   # Clear cache and reinstall
   pnpm clean
   pnpm install:all
   ```

### Performance Tips

1. **For better performance in production:**
   ```bash
   pnpm build:all
   ```

2. **Use production builds for client demos:**
   ```bash
   .\scripts\share-app.ps1 -Panel user -Production
   ```

## Security Notes

- **Never share admin credentials** in production
- **Use environment variables** for sensitive data
- **Enable HTTPS** for all production deployments
- **Consider authentication** for admin panels

## Support

If you encounter issues:
1. Check the console for error messages
2. Ensure all dependencies are installed
3. Verify ports are not in use
4. Check firewall settings
