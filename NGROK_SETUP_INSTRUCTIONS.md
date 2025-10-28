# Ngrok Setup for Login to Work Properly

## ✅ Current Status

- ✅ Backend running on port 4000
- ✅ Frontend ngrok tunnel active (port 5173)
- ❌ Backend ngrok tunnel needed

## 🚀 Quick Setup (2 Steps)

### Step 1: Start Backend Ngrok Tunnel

Open a **NEW terminal** and run:
```powershell
ngrok http 4000
```

You'll see output like:
```
Session Status                online
Account                       Your Account
...
Forwarding                    https://xxxx-xxxx-xxxx.ngrok-free.dev -> http://localhost:4000
```

**Copy the Forwarding URL** (the https:// one)

### Step 2: Update Frontend Configuration

**Option A: Using Environment Variable**

Create a file `user-panel/.env` and add:
```
VITE_NGROK_API_URL=https://your-backend-ngrok-url.ngrok-free.dev
```

**Option B: Update Code Directly**

Edit `user-panel/src/utils/apiBase.ts` and replace line 12:
```typescript
const backendNgrokUrl = 'https://your-actual-ngrok-url.ngrok-free.dev'
```

## 📝 Complete Setup

### Terminal 1: Backend
```powershell
cd backend
npm run dev
```
Backend runs on: http://192.168.1.66:4000

### Terminal 2: Frontend  
```powershell
cd user-panel
npm run dev
```
Frontend runs on: http://localhost:5173

### Terminal 3: Frontend Ngrok
```powershell
ngrok http 5173
```
Copy the forwarding URL for frontend access.

### Terminal 4: Backend Ngrok
```powershell
ngrok http 4000
```
Copy the forwarding URL and use it in Step 2 above.

## 🧪 Testing Login

1. Access frontend via ngrok URL (from Terminal 3)
2. Try to login
3. Check browser console (F12) - should see requests to backend ngrok URL
4. Backend terminal should show incoming requests

## ❗ Important Notes

- **Both ngrok tunnels must be running** for login to work externally
- The frontend ngrok URL is what users will access
- The backend ngrok URL must be configured in the frontend
- Keep all 4 terminals open while testing
- Free ngrok has session limits - plan accordingly

## 🔧 Troubleshooting

**Login not working?**
- Check browser console for API errors
- Verify backend is running (http://192.168.1.66:4000)
- Verify both ngrok tunnels are active
- Make sure you updated apiBase.ts with correct backend ngrok URL

**Backend not accessible?**
- Check backend terminal for errors
- Verify ngrok shows "online" status
- Try accessing backend ngrok URL directly in browser

**Ngrok session expired?**
- Restart both ngrok tunnels
- Get new URLs
- Update frontend configuration with new backend URL

