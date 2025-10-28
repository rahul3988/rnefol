# How to Test WhatsApp Integration from Admin Panel

## 🎯 Quick Steps to Test

### 1. Start the Backend Server

Make sure your backend server is running:
```powershell
cd backend
npm run dev
```

### 2. Open Admin Panel

Open the admin panel in your browser and navigate to:
**WhatsApp Chat** section (from the sidebar)

### 3. Click "Test WhatsApp" Button

You'll see a green button at the top right: **"Test WhatsApp"**

Click it to open the test modal.

### 4. Fill in the Details

- **Phone Number**: Enter the recipient's phone number with country code
  - Example: `917355384939` (India)
  - Example: `1234567890` (USA with country code: 1)
  
- **Message**: Type your test message
  - Example: "Hello from Nefol! This is a test message."

### 5. Send the Message

Click **"Send Message"** button. You'll see:

✅ **Success**: If message is sent successfully
❌ **Error**: If there's an issue (check error details)

### 6. Check the Response

The modal will show you the API response from Facebook WhatsApp API, which helps you debug any issues.

---

## 🔧 Troubleshooting

### "WhatsApp credentials not configured"
- Check that your `backend/.env` file has both:
  - `WHATSAPP_ACCESS_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`

### "Failed to send WhatsApp message"
- Check that your access token is valid (not expired)
- Verify your phone number ID is correct
- Make sure you're using the correct phone number format

### "Network error"
- Make sure the backend server is running on port 4000
- Check your internet connection
- Verify the Facebook Graph API is accessible

---

## 📊 What Happens Behind the Scenes

1. **Admin Panel** sends request to: `http://localhost:4000/api/whatsapp-chat/send`
2. **Backend** receives the request with phone number and message
3. **Backend** gets credentials from `.env` file
4. **Backend** makes POST request to Facebook Graph API:
   ```
   https://graph.facebook.com/v22.0/{PHONE_ID}/messages
   ```
5. **Facebook** delivers the message via WhatsApp Business API
6. **Response** is returned to admin panel showing success/error

---

## 🎉 Success Indicators

When everything works correctly, you'll see:
- ✅ Success alert: "Message sent successfully!"
- Message appears in the response panel
- Your phone receives the WhatsApp message

## 📱 What Recipients See

The recipient will receive the message on WhatsApp from your Business Account, showing it as a message from Nefol.

