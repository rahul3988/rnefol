# User Tracking System - Quick Setup Guide

## Setup Steps

### 1. Database Schema Initialization

The database tables will be automatically created when you start the backend server. The system creates the following tables:

- `user_activities` - Main activity tracking table
- `user_sessions` - Session tracking
- `user_stats` - Aggregated user statistics
- `user_preferences` - User preferences
- `user_addresses` - User addresses
- `user_notes` - Admin notes
- `user_tags` - User tags

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

The server will:
1. Initialize database schema
2. Create user activity tracking tables
3. Start listening on `http://192.168.1.66:4000`

### 3. Start Admin Panel

```bash
cd admin-panel
npm run dev
```

The admin panel will be available at `http://192.168.1.66:5174`

### 4. Access User Tracking

1. **Navigate to Users Page**:
   - Go to `http://192.168.1.66:5174/admin/users`
   - You'll see a list of all users with basic stats

2. **View User Details**:
   - Click on any user row
   - You'll be redirected to `/admin/users/:id`
   - View complete user information and activity timeline

3. **Search Users**:
   - Use the search bar to find users by name or email
   - Filter by verification status

## What Gets Tracked Automatically

The system automatically tracks the following events:

### 1. Authentication Events ✅
- User registration
- User login
- Captures IP address and user agent

### 2. Cart Events ✅
- Add to cart (product name, price, quantity)
- Remove from cart
- Updates cart status
- Includes product details

### 3. Page Views (Integration Required)
To enable page view tracking, add this to your user panel:

```typescript
// user-panel/src/App.tsx or in a custom hook
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function usePageTracking() {
  const location = useLocation()
  
  useEffect(() => {
    // Get session ID from localStorage or generate new one
    let sessionId = localStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('session_id', sessionId)
    }
    
    // Track page view
    fetch('http://192.168.1.66:4000/api/track/page-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        page_url: location.pathname,
        page_title: document.title,
        session_id: sessionId,
        referrer: document.referrer
      })
    }).catch(console.error)
  }, [location])
}

// Use in your App component
function App() {
  usePageTracking()
  // ... rest of your app
}
```

### 4. Form Submissions (Integration Required)
To track form submissions:

```typescript
const handleFormSubmit = async (formData: any) => {
  // Submit form
  await submitForm(formData)
  
  // Track submission
  await fetch('http://192.168.1.66:4000/api/track/form-submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      form_type: 'contact', // or 'newsletter', 'checkout', etc.
      form_data: formData,
      page_url: window.location.pathname
    })
  }).catch(console.error)
}
```

### 5. Order Events (Integration Required)
To track orders, add this after order creation:

```typescript
// After successful order placement
await fetch('http://192.168.1.66:4000/api/track/cart-event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    action: 'checkout',
    // Add order details
  })
}).catch(console.error)
```

## Testing the System

### 1. Create Test User Activities

```bash
# Register a new user
curl -X POST http://192.168.1.66:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+91 9876543210"
  }'

# Add item to cart (use the token from registration)
curl -X POST http://192.168.1.66:4000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_id": 1,
    "quantity": 2
  }'
```

### 2. View in Admin Panel

1. Go to `http://192.168.1.66:5174/admin/users`
2. Search for "Test User"
3. Click on the user
4. You should see:
   - Registration activity
   - Cart addition activity
   - User stats updated

## Features Available Now

### ✅ Fully Implemented
- [x] User list with search and filter
- [x] Click user to view details
- [x] Comprehensive user profile page
- [x] Activity timeline
- [x] Order history
- [x] Session tracking
- [x] Notes and tags management
- [x] Automatic login/register tracking
- [x] Automatic cart event tracking
- [x] User stats aggregation
- [x] Multiple tab views (Overview, Orders, Activity, Sessions, Notes)

### 🔄 Requires Integration
- [ ] Page view tracking (add to user panel)
- [ ] Form submission tracking (add to forms)
- [ ] Payment event tracking (add to payment flow)
- [ ] Product view tracking (add to product pages)

## API Endpoints Reference

### Get All Users
```
GET http://192.168.1.66:4000/api/users
```

### Get User Details
```
GET http://192.168.1.66:4000/api/users/:id
```

### Search Users
```
GET http://192.168.1.66:4000/api/users/search?q=john
```

### Get User Activity Timeline
```
GET http://192.168.1.66:4000/api/users/:id/activity?page=1&limit=50
```

### Add Note to User
```
POST http://192.168.1.66:4000/api/users/:id/notes
Headers: Authorization: Bearer YOUR_ADMIN_TOKEN
Body: {
  "note": "Customer requested priority shipping",
  "note_type": "important"
}
```

### Add Tag to User
```
POST http://192.168.1.66:4000/api/users/:id/tags
Headers: Authorization: Bearer YOUR_ADMIN_TOKEN
Body: {
  "tag": "VIP"
}
```

## Customization

### Adding Custom Activity Types

To track custom activities, use the `logUserActivity` function:

```typescript
import { logUserActivity } from './utils/userActivitySchema'

// In your route handler
await logUserActivity(pool, {
  user_id: userId,
  activity_type: 'custom_event',
  activity_subtype: 'specific_action',
  metadata: {
    // Any additional data
    custom_field: 'value'
  },
  user_agent: req.headers['user-agent'],
  ip_address: req.ip
})
```

### Adding Custom User Stats

To add custom statistics, modify the `user_stats` table:

```sql
ALTER TABLE user_stats ADD COLUMN custom_metric INTEGER DEFAULT 0;
```

Then update the `updateUserStats` function in `userActivitySchema.ts`.

## Troubleshooting

### Issue: Tables not created
**Solution**: Make sure the backend server started successfully and check logs for any database connection errors.

### Issue: User details not showing
**Solution**: 
1. Check if user exists in database
2. Verify API endpoint is accessible
3. Check browser console for errors
4. Verify route is correctly configured in App.tsx

### Issue: Activities not logging
**Solution**:
1. Check if `logUserActivity` is being called
2. Verify database connection
3. Check for any errors in backend logs
4. Verify user_id is valid

## Next Steps

1. **Integrate Page View Tracking**: Add the page tracking hook to your user panel
2. **Add Form Tracking**: Integrate form submission tracking in your forms
3. **Customize Dashboard**: Modify the UserDetail component to show additional metrics
4. **Add Export Functionality**: Implement CSV export for user data
5. **Set up Alerts**: Configure alerts for important user activities

## Support

For issues or questions:
1. Check the logs in the backend terminal
2. Inspect network requests in browser DevTools
3. Review the comprehensive documentation in USER_TRACKING_SYSTEM.md

---

**System is now ready to track user activities! 🎉**

All login, registration, and cart events are automatically tracked. Navigate to the users page and click on any user to see their complete activity timeline.

