# Nefol Coin History & Status Implementation

## Overview
Complete implementation of coin transaction history with proper status tracking (pending, processing, completed, rejected, failed) that reflects properly on the frontend.

## Database Changes

### New Table: `coin_transactions`
Created in `backend/src/utils/schema.ts`:

```sql
CREATE TABLE coin_transactions (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in (
    'earned', 'redeemed', 'purchase_bonus', 
    'withdrawal_pending', 'withdrawal_processing', 
    'withdrawal_completed', 'withdrawal_rejected', 
    'withdrawal_failed', 'referral_bonus', 
    'order_bonus', 'cashback'
  )),
  description text not null,
  order_id integer references orders(id) on delete set null,
  withdrawal_id integer references coin_withdrawals(id) on delete set null,
  status text not null default 'completed' check (status in (
    'pending', 'processing', 'completed', 
    'rejected', 'failed', 'cancelled'
  )),
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Backend API Changes

### New Endpoints

#### 1. Get Coin Transactions
- **Endpoint**: `GET /api/coin-transactions`
- **Auth**: Required
- **Response**: Returns all coin transactions for the authenticated user
- **Example**:
```json
{
  "data": [
    {
      "id": 1,
      "amount": 100,
      "type": "withdrawal_pending",
      "description": "Withdrawal requested via UPI",
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Updated Endpoints

#### 1. Create Withdrawal (`POST /api/coin-withdrawals`)
- Now records a transaction when withdrawal is created
- Transaction type: `withdrawal_pending`
- Status: `pending`

#### 2. Process Withdrawal (`PUT /api/admin/coin-withdrawals/:id/process`)
- Updates transaction status when admin processes withdrawal
- Status transitions:
  - `pending` → `processing`
  - `processing` → `completed` / `rejected` / `failed`
- Updates `coin_transactions` table when status changes

## Frontend Changes

### User Panel - NefolCoins.tsx

#### Features Added:
1. **Transaction History Display**
   - Fetches from `/api/coin-transactions`
   - Shows all coin transactions with proper icons
   - Displays status badges with color coding

2. **Status Badges**
   - 🟡 Pending (Yellow)
   - 🔵 Processing (Blue with animation)
   - 🟢 Completed (Green)
   - 🔴 Rejected/Failed (Red)

3. **Transaction Types & Icons**
   - Earned/Referral/Order Bonus → 📈 Green trend up
   - Purchase Bonus → 🛍️ Purple shopping bag
   - Withdrawal (pending/processing) → ⏰ Yellow clock
   - Withdrawal completed → 📈 Green trend up
   - Withdrawal rejected/failed → 🪙 Red coins

4. **Smart Date Formatting**
   - Shows "Just now" for recent transactions
   - Shows "X mins/hours/days ago" for relative time
   - Shows full date for older transactions

5. **Auto-Refresh**
   - Refreshes every 30 seconds to catch status updates
   - Listens for custom events from other pages
   - Silent refresh (no loading spinner on auto-refresh)

### User Panel - CoinWithdrawal.tsx

#### Features Added:
1. **Auto-Refresh**
   - Refreshes withdrawals list every 30 seconds
   - Shows updated status from admin processing

2. **Status Display**
   - Proper status badges matching the backend
   - Status icons for visual feedback
   - Rejection reason display

3. **Event Emitter**
   - Triggers `coinsUpdated` event after successful withdrawal
   - Other pages listen for updates

## Status Flow

### Withdrawal Status Progression:
1. **Created**: User creates withdrawal request
   - Transaction created with type: `withdrawal_pending`
   - Status: `pending`
   - Coins deducted from user balance

2. **Processing**: Admin starts processing
   - Transaction updated to type: `withdrawal_processing`
   - Status: `processing`

3. **Completed**: Admin completes processing
   - Transaction updated to type: `withdrawal_completed`
   - Status: `completed`

4. **Rejected/Failed**: Admin rejects or fails
   - Transaction updated to type: `withdrawal_rejected` / `withdrawal_failed`
   - Status: `rejected` / `failed`
   - Coins refunded to user balance

## Frontend Data Flow

### When User Creates Withdrawal:
1. Frontend calls `POST /api/coin-withdrawals`
2. Backend creates withdrawal record
3. Backend creates transaction record
4. Frontend refreshes data
5. Frontend dispatches `coinsUpdated` event
6. Other pages refresh automatically

### When Admin Processes Withdrawal:
1. Admin calls `PUT /api/admin/coin-withdrawals/:id/process`
2. Backend updates withdrawal status
3. Backend updates transaction status
4. Frontend auto-refreshes every 30 seconds
5. User sees updated status

### When User Views Transactions:
1. Frontend calls `GET /api/coin-transactions`
2. Backend returns all transactions
3. Frontend displays with proper formatting:
   - Icon based on type
   - Status badge
   - Relative timestamp
   - Amount with +/- indicator

## Testing

### To Test Transaction History:
1. Create a withdrawal request as user
2. Check NefolCoins page - should see transaction with status "pending"
3. Process withdrawal as admin
4. Check again after 30 seconds - status should update to "processing"
5. Complete/reject withdrawal as admin
6. Status should update to "completed" or "rejected"

### To Test Auto-Refresh:
1. Open NefolCoins page in browser
2. Create withdrawal in another tab
3. Return to NefolCoins page
4. Should see new transaction appear (within 30 seconds)
5. Or manually trigger by dispatching event

## Key Files Modified

### Backend:
- `backend/src/utils/schema.ts` - Added `coin_transactions` table
- `backend/src/index.ts` - Added endpoints and transaction recording

### Frontend:
- `user-panel/src/pages/NefolCoins.tsx` - Display transaction history
- `user-panel/src/pages/CoinWithdrawal.tsx` - Auto-refresh functionality

## Notes

- All transactions are properly linked to orders and withdrawals
- Transaction history is sorted by date (newest first)
- Status updates are reflected in real-time (30s interval)
- Proper error handling for all API calls
- Consistent data format across all endpoints
