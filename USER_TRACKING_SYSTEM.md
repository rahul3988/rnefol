# Comprehensive User Tracking System - Shopify-Style

## Overview
This document describes the complete user tracking and analytics system implemented for the Nefol e-commerce platform. Similar to Shopify's customer detail view, this system tracks all user activities including form submissions, orders, cart activities, payments, page views, and more.

## Features Implemented

### 1. **User Activity Tracking**
- **Page Views**: Track every page a user visits
- **Cart Events**: Add to cart, remove from cart, update quantity
- **Order Tracking**: Complete order history with items
- **Form Submissions**: Contact forms, newsletter signups, etc.
- **Payment Activities**: Payment attempts, successes, and failures
- **Authentication**: Login and registration events
- **Product Interactions**: Views, adds to cart, purchases

### 2. **User Profile Management**
- Complete user information
- Contact details (email, phone)
- Addresses (billing and shipping)
- Loyalty points and membership level
- User preferences and settings
- Tags and segmentation

### 3. **Analytics & Insights**
- Activity summary by type
- Most viewed pages
- Product interaction history
- Session tracking with device details
- Geographic information
- User lifetime value
- Purchase patterns

### 4. **Admin Features**
- Add notes about users
- Tag users for segmentation
- View complete activity timeline
- Real-time activity monitoring
- Search and filter users
- Export user data

## Database Schema

### Tables Created

#### `user_activities`
Main table for tracking all user activities:
```sql
- id: Serial Primary Key
- user_id: Foreign Key to users
- session_id: Session identifier
- activity_type: Type of activity (page_view, cart, order, payment, form_submit, login)
- activity_subtype: Subtype (add, remove, login, logout, etc.)
- page_url: URL of the page
- page_title: Title of the page
- product_id: Product identifier
- product_name: Product name
- product_price: Product price
- quantity: Quantity involved
- order_id: Order identifier
- form_type: Type of form submitted
- form_data: Form data (JSONB)
- payment_amount: Payment amount
- payment_method: Payment method used
- payment_status: Payment status
- user_agent: Browser user agent
- ip_address: User's IP address
- referrer: Referrer URL
- metadata: Additional metadata (JSONB)
- created_at: Timestamp
```

#### `user_sessions`
Track user sessions:
```sql
- id: Serial Primary Key
- user_id: Foreign Key to users
- session_id: Unique session identifier
- started_at: Session start time
- last_activity: Last activity timestamp
- ended_at: Session end time
- ip_address: IP address
- user_agent: Browser user agent
- device_type: Device type (mobile, desktop, tablet)
- browser: Browser name
- os: Operating system
- country: Country
- city: City
- is_active: Boolean
```

#### `user_stats`
Aggregated user statistics:
```sql
- user_id: Primary Key, Foreign Key to users
- total_page_views: Total page views
- total_sessions: Total sessions
- total_orders: Total orders
- total_spent: Total amount spent
- total_cart_additions: Total cart additions
- total_cart_removals: Total cart removals
- total_form_submissions: Total form submissions
- average_session_duration: Average session duration in seconds
- last_seen: Last seen timestamp
- last_order_date: Last order date
- last_page_viewed: Last page viewed
- lifetime_value: Customer lifetime value
- updated_at: Last updated timestamp
```

#### `user_preferences`
User preferences and settings:
```sql
- user_id: Primary Key, Foreign Key to users
- email_notifications: Boolean
- sms_notifications: Boolean
- push_notifications: Boolean
- marketing_emails: Boolean
- theme: Theme preference
- language: Language preference
- currency: Currency preference
```

#### `user_addresses`
User addresses:
```sql
- id: Serial Primary Key
- user_id: Foreign Key to users
- address_type: Address type (shipping, billing, both)
- full_name: Full name
- phone: Phone number
- address_line1: Address line 1
- address_line2: Address line 2
- city: City
- state: State
- postal_code: Postal code
- country: Country
- is_default: Boolean
```

#### `user_notes`
Admin notes about users:
```sql
- id: Serial Primary Key
- user_id: Foreign Key to users
- admin_id: Foreign Key to users (admin)
- note: Note text
- note_type: Note type (general, important, warning)
- created_at: Timestamp
- updated_at: Updated timestamp
```

#### `user_tags`
User tags for segmentation:
```sql
- id: Serial Primary Key
- user_id: Foreign Key to users
- tag: Tag name
- created_at: Timestamp
```

## API Endpoints

### User Management

#### `GET /api/users`
Get all users with summary statistics.

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9876543210",
    "is_verified": true,
    "member_since": "2024-01-01T00:00:00Z",
    "loyalty_points": 1500,
    "total_orders": 5,
    "total_spent": 15000,
    "last_seen": "2024-10-28T10:30:00Z",
    "total_page_views": 150,
    "total_sessions": 20
  }
]
```

#### `GET /api/users/:id`
Get detailed user profile with all activities.

**Response:**
```json
{
  "user": { /* User basic info */ },
  "stats": { /* User statistics */ },
  "addresses": [ /* User addresses */ ],
  "orders": [ /* User orders */ ],
  "activities": [ /* User activities */ ],
  "sessions": [ /* User sessions */ ],
  "notes": [ /* Admin notes */ ],
  "tags": [ /* User tags */ ],
  "cart": [ /* Current cart items */ ],
  "wishlist": [ /* Wishlist items */ ],
  "activitySummary": [ /* Activity summary */ ],
  "topPages": [ /* Most viewed pages */ ],
  "productInteractions": [ /* Product interactions */ ]
}
```

#### `GET /api/users/:id/activity`
Get user activity timeline with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `type`: Filter by activity type (optional)

**Response:**
```json
{
  "activities": [ /* Activities array */ ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 500,
    "totalPages": 10
  }
}
```

#### `POST /api/users/:id/notes`
Add a note to a user.

**Request Body:**
```json
{
  "note": "Customer requested priority shipping",
  "note_type": "important"
}
```

#### `POST /api/users/:id/tags`
Add a tag to a user.

**Request Body:**
```json
{
  "tag": "VIP"
}
```

#### `DELETE /api/users/:id/tags`
Remove a tag from a user.

**Request Body:**
```json
{
  "tag": "VIP"
}
```

### Activity Tracking

#### `POST /api/track/page-view`
Track a page view.

**Request Body:**
```json
{
  "page_url": "/products/skincare",
  "page_title": "Skincare Products",
  "session_id": "session_123",
  "referrer": "https://google.com"
}
```

#### `POST /api/track/form-submit`
Track a form submission.

**Request Body:**
```json
{
  "form_type": "contact",
  "form_data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Inquiry about products"
  },
  "page_url": "/contact"
}
```

#### `POST /api/track/cart-event`
Track a cart event.

**Request Body:**
```json
{
  "action": "add",
  "product_id": 123,
  "product_name": "Face Cream",
  "product_price": 1500,
  "quantity": 2
}
```

### Search & Filtering

#### `GET /api/users/search?q=john`
Search users by name, email, or phone.

**Query Parameters:**
- `q`: Search term
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### `GET /api/users/segments`
Get user segments.

**Response:**
```json
[
  { "segment": "high_value", "count": 25 },
  { "segment": "active", "count": 150 },
  { "segment": "inactive", "count": 50 },
  { "segment": "new", "count": 30 }
]
```

## Frontend Components

### UserDetail Component
Located at: `admin-panel/src/pages/users/UserDetail.tsx`

**Features:**
- Complete user profile view
- Activity timeline with filters
- Order history
- Session tracking
- Notes and tags management
- Multiple tabs for different data views

**Tabs:**
1. **Overview**: Activity summary, top pages, product interactions
2. **Orders**: Complete order history with items
3. **Activity**: Detailed activity timeline
4. **Sessions**: Session history with device info
5. **Notes**: Admin notes about the user

### Users List Component
Located at: `admin-panel/src/pages/Users.tsx`

**Features:**
- List all users with summary stats
- Search by name or email
- Filter by verification status
- Click on user to view details
- Sortable columns
- Statistics cards

## Automatic Activity Logging

The system automatically logs activities for the following events:

### 1. Authentication Events
- User registration
- User login
- User logout

### 2. Cart Events
- Add to cart
- Remove from cart
- Update cart quantity
- Clear cart

### 3. Order Events
- Order creation
- Order status changes
- Order completion
- Order cancellation

### 4. Payment Events
- Payment initiated
- Payment success
- Payment failure

### 5. Page View Events
- Every page visit
- Time spent on page
- Referrer information

## Usage Examples

### Accessing User Details

1. Navigate to `http://192.168.1.66:5174/admin/users`
2. Use the search bar to find a user by name or email
3. Click on any user row to view their complete details
4. View activity timeline, orders, sessions, and more

### Adding Notes

1. Go to user detail page
2. Click on "Notes" tab
3. Enter your note in the text area
4. Click "Add Note"

### Tagging Users

1. Go to user detail page
2. Find the "Tags" section in the left sidebar
3. Enter a tag name (e.g., "VIP", "High Value", "Priority")
4. Click "Add"

### Filtering Activities

1. Go to user detail page
2. Click on "Activity" tab
3. Use the activity type filter to view specific activities
4. Scroll to see paginated results

## Integration with Existing Systems

### Socket.IO Integration
The system integrates with Socket.IO for real-time updates:
- Live user count
- Real-time activity updates
- Instant notifications for admin

### Database Integration
All data is stored in PostgreSQL with proper indexes for performance:
- Indexed on user_id for fast lookups
- Indexed on created_at for time-based queries
- Indexed on activity_type for filtering
- JSONB fields for flexible metadata storage

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns are indexed
2. **Pagination**: Activity timeline supports pagination for large datasets
3. **Aggregation**: User stats are pre-aggregated for fast access
4. **Async Logging**: Activity logging is done asynchronously to not block requests

## Future Enhancements

1. **Advanced Analytics**:
   - Funnel analysis
   - Cohort analysis
   - Retention metrics
   - Churn prediction

2. **Automation**:
   - Automatic tagging based on behavior
   - Triggered emails based on activities
   - Workflow automation

3. **Exports**:
   - Export user data to CSV
   - Export activity reports
   - Custom report builder

4. **Integrations**:
   - Google Analytics integration
   - Facebook Pixel integration
   - CRM integration

## Testing

To test the system:

1. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the admin panel**:
   ```bash
   cd admin-panel
   npm run dev
   ```

3. **Create test activities**:
   - Register a new user
   - Login as the user
   - Browse products
   - Add items to cart
   - Place an order

4. **View in admin panel**:
   - Go to `http://192.168.1.66:5174/admin/users`
   - Click on the test user
   - Verify all activities are logged

## Troubleshooting

### Activities not showing
- Check if database tables are created (run migrations)
- Verify API endpoints are working
- Check browser console for errors
- Verify user_id is being passed correctly

### Slow performance
- Check database indexes
- Enable query logging to identify slow queries
- Consider adding Redis cache for frequently accessed data
- Optimize pagination limits

### Missing data
- Verify activity logging is enabled
- Check if logUserActivity is being called
- Verify database permissions
- Check for any error logs in backend

## Security Considerations

1. **Authentication**: All admin endpoints require authentication
2. **Authorization**: Only admins can view user details
3. **Data Privacy**: Sensitive data (passwords) is never logged
4. **GDPR Compliance**: Users can request data deletion
5. **IP Anonymization**: Consider anonymizing IP addresses for privacy

## Conclusion

This comprehensive user tracking system provides Shopify-level insights into user behavior, enabling better customer service, targeted marketing, and data-driven decision making. All user activities are tracked automatically and displayed in an intuitive admin interface.

For any questions or issues, refer to the API documentation or contact the development team.

