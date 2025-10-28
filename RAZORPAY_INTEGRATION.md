# Razorpay Payment Gateway Integration

This document describes the Razorpay payment gateway integration for the NEFOL e-commerce platform.

## Overview

Razorpay has been integrated to enable online payments for the checkout process. The integration includes:
- Backend API for creating Razorpay orders
- Payment verification
- Webhook support for payment status updates
- Frontend checkout flow with Razorpay widget

## Credentials

The following Razorpay test credentials are configured:
- **Key ID**: `rzp_test_RYUiNXjGPYECIB`
- **Key Secret**: `QoMYD9QaYxXVDuKiyd9P1mxR`

These credentials are hardcoded in the backend code as fallbacks, but should be moved to environment variables in production.

## Backend Integration

### Files Modified/Created:
1. **`backend/src/routes/payment.ts`** - New file containing Razorpay payment handlers
2. **`backend/src/index.ts`** - Updated to add payment routes and import payment handlers
3. **`backend/package.json`** - Added `razorpay` dependency

### API Endpoints:

#### 1. Create Razorpay Order
```
POST /api/payment/razorpay/create-order
```

Request Body:
```json
{
  "amount": 1000.00,
  "currency": "INR",
  "order_number": "NEFOL-1234567890",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "9876543210"
}
```

Response:
```json
{
  "id": "order_ABC123",
  "amount": 100000,
  "currency": "INR",
  "key_id": "rzp_test_RYUiNXjGPYECIB"
}
```

#### 2. Verify Razorpay Payment
```
POST /api/payment/razorpay/verify
```

Request Body:
```json
{
  "razorpay_order_id": "order_ABC123",
  "razorpay_payment_id": "pay_XYZ789",
  "razorpay_signature": "signature_hash",
  "order_number": "NEFOL-1234567890"
}
```

#### 3. Razorpay Webhook
```
POST /api/payment/razorpay/webhook
```

Handles webhook events from Razorpay to update order status.

## Frontend Integration

### Files Modified:
1. **`user-panel/index.html`** - Added Razorpay checkout script and updated CSP
2. **`user-panel/src/services/api.ts`** - Added Razorpay API methods
3. **`user-panel/src/pages/Checkout.tsx`** - Integrated Razorpay payment flow

### Checkout Flow:

1. User fills in shipping information
2. User selects "Razorpay" as payment method
3. On clicking "Place Order", the system:
   - Creates an order in the backend
   - Creates a Razorpay order
   - Opens the Razorpay checkout widget
4. User completes payment in Razorpay widget
5. Payment is verified on success
6. User is redirected to confirmation page

## Security Considerations

1. **Never expose the Key Secret** - The secret key is only used on the backend
2. **Always verify payment signatures** - The backend verifies all payment signatures
3. **Use HTTPS** - Especially important for webhook endpoints
4. **Environment Variables** - Move credentials to `.env` file (currently hardcoded as fallbacks)

## Testing

### Using Razorpay Test Cards:

For successful payment testing, use these test card details:
- **Card Number**: 4111 1111 1111 1111
- **CVV**: 123
- **Expiry**: Any future date (e.g., 12/25)
- **Name**: Any name

### Payment Status:
- **Success**: Order status updates to "confirmed" with payment_status "paid"
- **Failure**: Order status updates to "pending" with payment_status "failed"

## Environment Setup

To configure Razorpay in your environment:

1. Copy `backend/env.example` to `backend/.env`
2. Add your Razorpay credentials:
   ```
   RAZORPAY_KEY_ID=rzp_test_RYUiNXjGPYECIB
   RAZORPAY_KEY_SECRET=QoMYD9QaYxXVDuKiyd9P1mxR
   ```

Note: The credentials are currently hardcoded as fallbacks in the code. To use environment variables:
- Update `backend/src/routes/payment.ts` to read from `process.env` without fallback
- Restart the backend server after updating `.env`

## Future Enhancements

1. **Payment Gateway Selection** - Allow admin to enable/disable Razorpay
2. **Multiple Payment Methods** - Add support for more payment gateways
3. **Refund Handling** - Automate refunds through Razorpay API
4. **Subscription Payments** - Support for recurring payments
5. **Payment Analytics** - Track payment success rates and failure reasons

## Support

For issues or questions about Razorpay integration:
- Check Razorpay documentation: https://razorpay.com/docs/
- Contact Razorpay support: https://razorpay.com/support/

