# Backend API Structure for Admin Panel Integration

This document outlines the complete API structure needed to wire up the admin panel with the user panel.

## Base Configuration

```javascript
// Environment Variables
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001
```

## Authentication APIs

### Admin Authentication
```javascript
POST /api/admin/auth/login
POST /api/admin/auth/logout
POST /api/admin/auth/verify
GET /api/admin/auth/profile
PUT /api/admin/auth/profile
```

## User Management APIs

### User Profiles
```javascript
GET /api/admin/users/profiles?page=1&limit=10&search=query&status=verified
GET /api/admin/users/profiles/:userId
POST /api/admin/users/profiles
PUT /api/admin/users/profiles/:userId
DELETE /api/admin/users/profiles/:userId
PUT /api/admin/users/bulk-status
GET /api/admin/users/export?format=csv
POST /api/admin/users/import
```

### User Notifications
```javascript
GET /api/admin/notifications?page=1&limit=10&type=order&status=sent
POST /api/admin/notifications
GET /api/admin/notifications/:notificationId
PUT /api/admin/notifications/:notificationId
DELETE /api/admin/notifications/:notificationId
POST /api/admin/notifications/:notificationId/send
POST /api/admin/notifications/bulk-send
```

## Loyalty Program APIs

### Loyalty Programs
```javascript
GET /api/admin/loyalty/programs
POST /api/admin/loyalty/programs
GET /api/admin/loyalty/programs/:programId
PUT /api/admin/loyalty/programs/:programId
DELETE /api/admin/loyalty/programs/:programId
```

### Loyalty Tiers
```javascript
GET /api/admin/loyalty/tiers
POST /api/admin/loyalty/tiers
PUT /api/admin/loyalty/tiers/:tierId
DELETE /api/admin/loyalty/tiers/:tierId
```

### User Loyalty Data
```javascript
GET /api/admin/loyalty/users?page=1&limit=10
GET /api/admin/loyalty/users/:userId
POST /api/admin/loyalty/users/:userId/adjust
GET /api/admin/loyalty/users/:userId/history
```

## Content Management APIs

### Static Pages
```javascript
GET /api/admin/static-pages?type=about&status=active
POST /api/admin/static-pages
GET /api/admin/static-pages/:pageId
PUT /api/admin/static-pages/:pageId
DELETE /api/admin/static-pages/:pageId
PUT /api/admin/static-pages/:pageId/toggle
```

### Community Management
```javascript
// Posts
GET /api/admin/community/posts?page=1&limit=10&status=pending
GET /api/admin/community/posts/:postId
PUT /api/admin/community/posts/:postId/status
DELETE /api/admin/community/posts/:postId
POST /api/admin/community/posts/bulk-delete

// Comments
GET /api/admin/community/comments?page=1&limit=10&status=pending
GET /api/admin/community/comments/:commentId
PUT /api/admin/community/comments/:commentId/status
DELETE /api/admin/community/comments/:commentId
```

## E-commerce Management APIs

### Cart Management
```javascript
GET /api/admin/cart/items?page=1&limit=10&user_id=123
GET /api/admin/cart/items/:itemId
PUT /api/admin/cart/items/:itemId
DELETE /api/admin/cart/items/:itemId
GET /api/admin/cart/stats
```

### Checkout Sessions
```javascript
GET /api/admin/checkout/sessions?page=1&limit=10&status=pending
GET /api/admin/checkout/sessions/:sessionId
PUT /api/admin/checkout/sessions/:sessionId/status
GET /api/admin/checkout/sessions/:sessionId/details
```

## Analytics APIs

### Dashboard Statistics
```javascript
GET /api/admin/dashboard/stats
GET /api/admin/analytics/users?range=30d
GET /api/admin/analytics/orders?range=30d
GET /api/admin/analytics/revenue?range=30d
GET /api/admin/analytics/community?range=30d
```

## System APIs

### Health Check
```javascript
GET /api/admin/system/health
GET /api/admin/system/api-status
GET /api/admin/system/logs
```

## Real-time Updates (Socket.IO)

### Admin Socket Events
```javascript
// Listen for real-time updates
socket.on('user-registered', (userData) => {})
socket.on('order-created', (orderData) => {})
socket.on('payment-completed', (paymentData) => {})
socket.on('community-post-created', (postData) => {})
socket.on('notification-sent', (notificationData) => {})

// Emit admin actions
socket.emit('admin-action', { type: 'user-updated', data: userData })
socket.emit('admin-action', { type: 'notification-sent', data: notificationData })
```

## Database Schema Requirements

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  loyalty_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  member_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  profile_photo VARCHAR(500),
  preferences JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(10) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  read_at TIMESTAMP
);
```

### Loyalty Programs Table
```sql
CREATE TABLE loyalty_programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_per_rupee DECIMAL(5,2) NOT NULL,
  min_order_amount DECIMAL(10,2) NOT NULL,
  max_points_per_order INTEGER,
  expiry_days INTEGER DEFAULT 365,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Static Pages Table
```sql
CREATE TABLE static_pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  page_type VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Community Posts Table
```sql
CREATE TABLE community_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Cart Items Table
```sql
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Checkout Sessions Table
```sql
CREATE TABLE checkout_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  items_count INTEGER NOT NULL,
  payment_method VARCHAR(50),
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Priority

### Phase 1: Core User Management
1. User Profiles Management
2. User Notifications
3. Basic Analytics

### Phase 2: Content Management
1. Static Pages Management
2. Community Management
3. Loyalty Program Management

### Phase 3: E-commerce Management
1. Cart Management
2. Checkout Sessions
3. Advanced Analytics

### Phase 4: Advanced Features
1. Real-time Updates
2. Bulk Operations
3. Export/Import
4. System Health Monitoring

## Security Considerations

1. **Authentication**: JWT tokens for admin authentication
2. **Authorization**: Role-based access control
3. **Rate Limiting**: Prevent API abuse
4. **Input Validation**: Sanitize all inputs
5. **CORS**: Configure for admin panel domain
6. **HTTPS**: Use SSL certificates in production

## Error Handling

All APIs should return consistent error responses:

```javascript
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional details
}
```

## Pagination

All list endpoints should support pagination:

```javascript
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

This comprehensive API structure ensures complete integration between the admin panel and user panel, providing full control over all user-facing features.
