import { Router } from 'express'
import crypto from 'crypto'
import { sendError, sendSuccess } from '../utils/apiHelpers'
import Razorpay from 'razorpay'

const router = Router()

// Get Razorpay credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_RYUiNXjGPYECIB'
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'QoMYD9QaYxXVDuKiyd9P1mxR'

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
})

// Create Razorpay order
export const createRazorpayOrder = (pool: any) => async (req: any, res: any) => {
  try {
    const { amount, currency = 'INR', order_number, customer_name, customer_email, customer_phone } = req.body

    if (!amount || !order_number) {
      return sendError(res, 400, 'Amount and order_number are required')
    }

    // Create order in Razorpay
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: order_number,
      notes: {
        order_number,
        customer_name,
        customer_email,
        customer_phone
      }
    }

    const order = await razorpay.orders.create(options)

    sendSuccess(res, {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: RAZORPAY_KEY_ID
    })
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err)
    sendError(res, 500, 'Failed to create Razorpay order', err)
  }
}

// Verify Razorpay payment
export const verifyRazorpayPayment = (pool: any) => async (req: any, res: any) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_number } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, 400, 'Payment verification details are required')
    }

    // Verify the signature
    const generated_signature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const isAuthentic = generated_signature === razorpay_signature

    if (!isAuthentic) {
      return sendError(res, 400, 'Payment verification failed')
    }

    // Update order status in database
    await pool.query(
      `UPDATE orders SET status = $1, payment_status = $2, razorpay_order_id = $3, razorpay_payment_id = $4 WHERE order_number = $5`,
      ['confirmed', 'paid', razorpay_order_id, razorpay_payment_id, order_number]
    )

    // Get the order details
    const result = await pool.query('SELECT * FROM orders WHERE order_number = $1', [order_number])
    
    sendSuccess(res, {
      verified: true,
      order: result.rows[0]
    })
  } catch (err: any) {
    console.error('Error verifying Razorpay payment:', err)
    sendError(res, 500, 'Failed to verify payment', err)
  }
}

// Razorpay webhook handler
export const razorpayWebhook = (pool: any) => async (req: any, res: any) => {
  try {
    const webhook_secret = req.headers['x-razorpay-signature']
    const webhookBody = JSON.stringify(req.body)

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(webhookBody)
      .digest('hex')

    if (webhook_secret !== expectedSignature) {
      return sendError(res, 401, 'Invalid webhook signature')
    }

    const event = req.body.event

    // Handle payment success
    if (event === 'payment.captured' || event === 'payment.authorized') {
      const paymentData = req.body.payload.payment.entity
      const orderId = paymentData.notes.order_number

      // Update order status
      await pool.query(
        `UPDATE orders SET status = $1, payment_status = $2 WHERE order_number = $3`,
        ['confirmed', 'paid', orderId]
      )

      console.log('✅ Payment captured for order:', orderId)
    }

    // Handle payment failure
    if (event === 'payment.failed') {
      const paymentData = req.body.payload.payment.entity
      const orderId = paymentData.notes.order_number

      // Update order status
      await pool.query(
        `UPDATE orders SET status = $1, payment_status = $2 WHERE order_number = $3`,
        ['pending', 'failed', orderId]
      )

      console.log('❌ Payment failed for order:', orderId)
    }

    sendSuccess(res, { received: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    sendError(res, 500, 'Webhook processing failed', err)
  }
}

export default router

