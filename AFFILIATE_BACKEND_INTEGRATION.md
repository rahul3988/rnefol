# Affiliate Program Backend Integration

## 🚀 Complete Backend Implementation

This document outlines the complete backend integration for the Nefol Affiliate Program, including API endpoints, database schema, admin interface, and code generation system.

## 📊 Database Schema

### Core Tables

#### 1. `affiliate_applications`
Stores affiliate program applications submitted by users.

```sql
CREATE TABLE affiliate_applications (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  instagram TEXT,
  snapchat TEXT,
  youtube TEXT,
  facebook TEXT,
  followers TEXT,
  platform TEXT,
  experience TEXT,
  why_join TEXT,
  expected_sales TEXT,
  house_number TEXT NOT NULL,
  street TEXT NOT NULL,
  building TEXT,
  apartment TEXT,
  road TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  state TEXT NOT NULL,
  agree_terms BOOLEAN NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_code TEXT,
  admin_notes TEXT,
  rejection_reason TEXT,
  application_date TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `affiliate_partners`
Stores active affiliate partner information and verification status.

```sql
CREATE TABLE affiliate_partners (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES affiliate_applications(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  verification_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'active', 'suspended', 'terminated')),
  commission_rate NUMERIC(5,2) DEFAULT 15.0,
  total_earnings NUMERIC(12,2) DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  pending_earnings NUMERIC(12,2) DEFAULT 0,
  last_payment TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `affiliate_referrals`
Tracks individual referrals and commission calculations.

```sql
CREATE TABLE affiliate_referrals (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  order_total NUMERIC(12,2) NOT NULL,
  commission_earned NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
  referral_date TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `affiliate_payouts`
Manages commission payouts to affiliate partners.

```sql
CREATE TABLE affiliate_payouts (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method TEXT,
  payment_reference TEXT,
  payout_period_start TIMESTAMPTZ NOT NULL,
  payout_period_end TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔌 API Endpoints

### Public Endpoints

#### Submit Affiliate Application
```http
POST /api/admin/affiliate-applications
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "instagram": "@johndoe",
  "youtube": "https://youtube.com/@johndoe",
  "followers": "10k-25k",
  "platform": "instagram",
  "experience": "2 years of affiliate marketing experience...",
  "why_join": "I love promoting natural skincare products...",
  "expected_sales": "10k-25k",
  "house_number": "123",
  "street": "Main Street",
  "road": "MG Road",
  "city": "Mumbai",
  "pincode": "400001",
  "state": "Maharashtra",
  "agree_terms": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "status": "pending",
    "application_date": "2024-01-15T10:30:00Z"
  }
}
```

### Authenticated Endpoints

#### Verify Affiliate Code
```http
POST /api/affiliate/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "verificationCode": "12345678901234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Account verified successfully",
    "affiliateLink": "https://nefol.com?ref=1",
    "commissionRate": 15.0
  }
}
```

#### Get Affiliate Dashboard
```http
GET /api/affiliate/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active",
    "commission_rate": 15.0,
    "total_earnings": 1250.00,
    "total_referrals": 8,
    "completed_referrals": 5,
    "pending_earnings": 1000.00,
    "recent_referrals": [...]
  }
}
```

#### Get Affiliate Referrals
```http
GET /api/affiliate/referrals?page=1&limit=20
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get All Applications
```http
GET /api/admin/affiliate-applications?status=pending&page=1&limit=10
```

#### Approve Application
```http
PUT /api/admin/affiliate-applications/{id}/approve
Content-Type: application/json

{
  "adminNotes": "Great social media presence, approved!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {...},
    "verificationCode": "a1b2c3d4e5f6g7h8i9j0",
    "message": "Application approved successfully"
  }
}
```

#### Reject Application
```http
PUT /api/admin/affiliate-applications/{id}/reject
Content-Type: application/json

{
  "rejectionReason": "Insufficient follower count for our program"
}
```

#### Regenerate Verification Code
```http
POST /api/admin/affiliate-partners/{id}/regenerate-code
```

## 🔐 Security Features

### 1. Verification Code Generation
- **20-digit hexadecimal codes** using crypto.randomBytes()
- **Unique constraint** prevents duplicate codes
- **One-time use** codes are invalidated after verification

### 2. Authentication
- **JWT token validation** for all protected endpoints
- **User ID extraction** from token for data isolation
- **Role-based access** for admin functions

### 3. Data Validation
- **Required field validation** for applications
- **Email uniqueness** checks
- **Social media validation** (at least one required)
- **Input sanitization** and length limits

## 🎯 Admin Interface Features

### Application Management
- **Real-time dashboard** with application statistics
- **Status filtering** (pending, approved, rejected)
- **Detailed application view** with all information
- **Bulk actions** for efficient management

### Approval Workflow
1. **Review application** details
2. **Add admin notes** (optional)
3. **Generate verification code** automatically
4. **Send code to user** via email/SMS
5. **Track verification status**

### Rejection Process
1. **Select rejection reason** from predefined options
2. **Add custom notes** for user feedback
3. **Notify user** of rejection with reason
4. **Archive application** for record keeping

## 📈 Analytics & Reporting

### Commission Tracking
- **Real-time earnings** calculation
- **Referral tracking** with order details
- **Commission rate** management per partner
- **Payout scheduling** and processing

### Performance Metrics
- **Conversion rates** by affiliate
- **Top performers** identification
- **Revenue attribution** tracking
- **Geographic performance** analysis

## 🔄 Integration Points

### Order Processing
- **Affiliate ID tracking** in orders table
- **Automatic commission** calculation
- **Referral attribution** on checkout
- **Commission confirmation** workflow

### User Management
- **Seamless user creation** for verified affiliates
- **Profile synchronization** between systems
- **Authentication integration** with existing auth system

### Payment Processing
- **Commission payout** automation
- **Payment method** management
- **Tax reporting** integration
- **Financial reconciliation** tools

## 🚀 Deployment Checklist

### Database Setup
- [ ] Run schema migration
- [ ] Create database indexes
- [ ] Set up foreign key constraints
- [ ] Configure backup procedures

### API Configuration
- [ ] Set up environment variables
- [ ] Configure CORS settings
- [ ] Set up rate limiting
- [ ] Enable request logging

### Security Configuration
- [ ] Configure JWT secrets
- [ ] Set up HTTPS certificates
- [ ] Enable input validation
- [ ] Configure firewall rules

### Monitoring Setup
- [ ] Set up error tracking
- [ ] Configure performance monitoring
- [ ] Set up database monitoring
- [ ] Enable audit logging

## 📝 Usage Examples

### Complete Workflow Example

1. **User submits application:**
```javascript
const response = await fetch('/api/admin/affiliate-applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(applicationData)
})
```

2. **Admin reviews and approves:**
```javascript
const response = await fetch(`/api/admin/affiliate-applications/${appId}/approve`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ adminNotes: 'Approved!' })
})
```

3. **User verifies with code:**
```javascript
const response = await fetch('/api/affiliate/verify', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({ verificationCode: 'a1b2c3d4e5f6g7h8i9j0' })
})
```

4. **User accesses dashboard:**
```javascript
const response = await fetch('/api/affiliate/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

## 🔧 Maintenance & Support

### Regular Tasks
- **Monitor application queue** for pending reviews
- **Process commission payouts** on schedule
- **Update commission rates** as needed
- **Archive old applications** for storage management

### Troubleshooting
- **Code generation issues** - Check crypto module
- **Verification failures** - Validate code format
- **Commission calculations** - Review order attribution
- **Performance issues** - Check database indexes

This complete backend integration provides a robust, scalable foundation for the Nefol Affiliate Program with comprehensive admin controls, secure verification, and detailed analytics.
