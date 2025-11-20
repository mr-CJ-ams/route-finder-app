# Deploying to Render.com - Frontend Only Guide

This guide walks you through deploying your Vite + React frontend to Render.com, a modern cloud platform with free tier options.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Prepare Your Project](#prepare-your-project)
3. [Create Render.com Account](#create-rendercom-account)
4. [Deploy Static Site](#deploy-static-site)
5. [Verify Deployment](#verify-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **GitHub Account** - Required (Render deploys from GitHub)  
✅ **Project Already in GitHub** - Your code must be pushed to GitHub  
✅ **Render.com Account** - Free to create  
✅ **Your Local Project** - Frontend-only (no backend required)

---

## Prepare Your Project

### Step 1: Ensure Your Project is in GitHub

Push your project to GitHub if you haven't already:

```powershell
# Navigate to your project root
cd c:\Users\User\Amaquin\TDMS_PANGLAO_V2.1

# Check if Git is initialized
git status

# If not initialized, initialize and add remote
git init
git add .
git commit -m "Initial commit - Frontend only"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

**Note:** Replace `YOUR-USERNAME` and `YOUR-REPO-NAME` with your actual GitHub username and repository name.

### Step 2: Verify Build Configuration

Your `vite.config.js` is already configured correctly:

```javascript
build: {
  outDir: 'build',  // ✅ Output directory for production build
  sourcemap: true,
}
```

The build directory is set to `build/`, which Render will use.

### Step 3: Verify package.json Scripts

Your `package.json` has the correct build script:

```json
"scripts": {
  "build": "vite build",  // ✅ This builds your app
  "dev": "vite",
  "preview": "vite preview"
}
```

✅ **Ready to deploy!**

---

## Create Render.com Account

### Step 1: Sign Up

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started"** or **"Sign Up"**
3. Choose **Sign up with GitHub** (easiest option)
4. Authorize Render to access your GitHub account
5. Complete the registration

### Step 2: Grant GitHub Repository Access

1. In Render dashboard, you may need to authorize which GitHub repositories Render can access
2. Either select all repositories or specific ones
3. Save settings

---

## Deploy Static Site

### Step 1: Create New Static Site on Render

1. From Render dashboard, click **"New +"** button
2. Select **"Static Site"**
3. You'll be prompted to connect a repository

### Step 2: Connect GitHub Repository

1. Click **"Connect"** on your repository
   - If you don't see your repo, click "Configure account" to grant full access
2. Select the repository containing your project
3. Click **"Connect"**

### Step 3: Configure Build Settings

Fill in the deployment form with these values:

| Field | Value |
|-------|-------|
| **Name** | `tdms-panglao-route-finder` (or your preferred name) |
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `client/build` |
| **Branch** | `main` |

**Important:** 
- **Publish Directory** must be `client/build` because your vite.config.js outputs to `build/` inside the `client/` folder
- If your project root is at the root, use just `build`

### Step 4: Set Environment Variables (if needed)

Since your app uses external APIs (Nominatim, OSRM, Leaflet), these don't require API keys:

- Nominatim (reverse geocoding) - free, no key needed
- OSRM (routing) - free, no key needed
- Leaflet (maps) - free, loaded from CDN

**You can skip environment variables for now.** If needed later, click "Advanced" and add them.

### Step 5: Deploy

1. Click **"Create Static Site"**
2. Render will automatically build and deploy your site
3. You'll see the build logs in real-time
4. Wait for completion (usually 2-3 minutes)
5. Once complete, you'll get a URL like: `https://tdms-panglao-route-finder.onrender.com`

---

## Verify Deployment

### Step 1: Check Build Status

In your Render dashboard:
- ✅ Green checkmark = Successful deployment
- ❌ Red X = Build failed (check logs)

### Step 2: Visit Your Deployed Site

1. Click the generated URL in your Render dashboard
2. Your site should load at the provided URL
3. Test functionality:
   - [ ] Map loads
   - [ ] Geolocation works (browser may ask for permission)
   - [ ] Route search functionality works
   - [ ] Fare calculation displays correctly
   - [ ] No console errors (open DevTools with F12)

### Step 3: Share Your URL

Your site is now live! Share the URL with others:
- Example: `https://tdms-panglao-route-finder.onrender.com`

---

## Automatic Redeployment

Render automatically redeploys your site whenever you:

1. Push changes to your GitHub repository's `main` branch
2. The build completes successfully
3. Your site updates automatically (no manual action needed)

**Example workflow:**
```powershell
# Make changes locally
git add .
git commit -m "Update route finder feature"
git push origin main

# Render automatically detects the push and redeploys
# Check your Render dashboard for build progress
```

---

## Custom Domain (Optional)

To use a custom domain instead of the onrender.com URL:

1. In Render dashboard, go to your site's **Settings**
2. Under **Custom Domain**, click **"Add Custom Domain"**
3. Enter your domain (e.g., `routefinder.com`)
4. Add the DNS records to your domain registrar (GoDaddy, Namecheap, etc.)
5. Verify and activate

---

## Troubleshooting

### Build Fails with "Module not found"

**Problem:** Build process can't find a dependency

**Solution:**
```powershell
# Ensure all dependencies are installed
cd client
npm install

# Push changes to GitHub
git add package-lock.json
git commit -m "Update dependencies"
git push origin main
```

### Build Command Errors

**Problem:** "npm: command not found"

**Solution:** Make sure Build Command is exactly:
```
npm install && npm run build
```

### Site Shows Blank Page

**Problem:** The deployed site doesn't load content

**Solution:**
1. Check browser console (F12 → Console tab)
2. Check Render build logs for errors
3. Verify Publish Directory is `client/build`
4. Ensure your App.jsx exports correctly

### API Calls Failing (CORS Errors)

**Problem:** External APIs (Nominatim, OSRM) are blocked

**Solution:** These should work by default since they have CORS enabled. If not:
1. Check browser console for exact error
2. Verify API URLs in your code are correct
3. Add appropriate CORS headers in your fetch calls

Example in your code:
```javascript
const response = await fetch(
  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
  {
    headers: {
      'User-Agent': 'TDMS-Panglao-RouteF (routefinder.onrender.com)'
    }
  }
);
```

### Map Not Rendering

**Problem:** Leaflet maps appear blank or CDN fails to load

**Solution:**
1. Check browser Network tab (F12 → Network) for failed requests
2. Ensure Leaflet CDN link in your code is correct
3. Check if any ad/script blockers are interfering
4. Verify dynamic Leaflet script injection is working

---

## Performance Tips

1. **Minimize Build Size:**
   - Your current bundle is already optimized with Vite
   - Render caches dependencies automatically

2. **Reduce Initial Load Time:**
   - The site is fast since it's a static site (no server processing)
   - CDN delivery ensures worldwide fast access

3. **Monitor Deployment:**
   - Render dashboard shows deployment history
   - Can rollback to previous version if needed

---

## Next Steps After Deployment

1. ✅ Share your live URL with stakeholders
2. ✅ Test thoroughly on different devices and browsers
3. ✅ Monitor for errors using browser DevTools
4. ✅ Set up GitHub Actions for automated testing (optional)
5. ✅ Plan for future backend integration if needed

---

## Useful Render.com Resources

- [Render Static Site Docs](https://render.com/docs/static-sites)
- [Render Dashboard](https://dashboard.render.com)
- [Render Support](https://support.render.com)

---

## Summary

| Step | Action |
|------|--------|
| 1 | Ensure project is pushed to GitHub |
| 2 | Sign up for Render.com account |
| 3 | Create Static Site on Render |
| 4 | Connect GitHub repository |
| 5 | Set Build Command: `npm install && npm run build` |
| 6 | Set Publish Directory: `client/build` |
| 7 | Click Deploy and wait 2-3 minutes |
| 8 | Visit your live URL |
| 9 | Test all features |
| 10 | Share with team/stakeholders |

Your site will automatically redeploy whenever you push changes to GitHub! 🚀

---

**Questions?** Check Render's documentation or contact support at [support.render.com](https://support.render.com)
