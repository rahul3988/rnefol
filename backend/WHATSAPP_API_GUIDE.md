# WhatsApp Business API Integration Guide

## 📍 Where to Add Facebook API Credentials

### Location: `backend/.env` file

```env
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_facebook_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
```

## 🔑 Getting Credentials from developers.facebook.com

### Step 1: Get WhatsApp Phone Number ID
1. Go to https://developers.facebook.com
2. Select your app
3. Navigate to **WhatsApp** → **API Setup**
4. Copy the **Phone number ID** (e.g., `368410443015784`)

### Step 2: Get WhatsApp Access Token
1. In your WhatsApp app, go to **WhatsApp** → **API Setup**
2. Copy the **Temporary access token** for testing
   - Expires after 24 hours
3. For production, create a **Permanent access token**:
   - Go to **WhatsApp** → **Get Started**
   - Use Facebook Graph API Explorer to generate permanent token

## 📤 How to Send WhatsApp Messages

### Option 1: Send Template Message (via curl)
```powershell
curl -X POST `
  http://localhost:4000/api/whatsapp-chat/send `
  -H "Content-Type: application/json" `
  -d '{
    "to": "917355384939",
    "template": {
      "name": "hello_world",
      "language": "en_US"
    }
  }'
```

### Option 2: Send Text Message
```powershell
curl -X POST `
  http://localhost:4000/api/whatsapp-chat/send `
  -H "Content-Type: application/json" `
  -d '{
    "to": "917355384939",
    "message": "Hello from Nefol!"
  }'
```

### Option 3: Send via JavaScript/Admin Panel
```javascript
fetch('http://localhost:4000/api/whatsapp-chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '917355384939',
    message: 'Hello from Nefol!'
  })
})
```

## 🔄 What Happened?

I created a backend endpoint that:

1. **Receives your WhatsApp request** at `/api/whatsapp-chat/send`
2. **Invokes Facebook Graph API** with your credentials
3. **Sends the message** to the recipient via WhatsApp Business API
4. **Logs the message** to your database
5. **Returns the response** from Facebook API

## 🎯 API Endpoint Details

**POST** `/api/whatsapp-chat/send`

### Request Body:

```json
{
  "to": "917355384939",           // Required: Recipient phone number
  "message": "Your text message",  // Optional: For text messages
  "template": {                     // Optional: For template messages
    "name": "hello_world",
    "language": "en_US"
  }
}
```

### Response:

```json
{
  "success": true,
  "data": {
    "message": "WhatsApp message sent successfully",
    "whatsappResponse": {
      "messaging_product": "whatsapp",
      "contacts": [...],
      "messages": [...]
    }
  }
}
```

## 🚀 Next Steps

1. Update `backend/.env` with your Facebook API credentials
2. Restart your backend server
3. Test the endpoint using the curl commands above

## 📝 Important Notes

- Phone numbers must include country code (e.g., `917355384939` for India)
- For production, use permanent access tokens
- Template messages must be approved by WhatsApp
- Text messages can only be sent to users within 24-hour window (unless using template)

