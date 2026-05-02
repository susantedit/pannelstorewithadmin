# Dynamic Payment Window Implementation

## Overview
Implemented a dynamic 2-hour payment window system that starts from the moment a user creates an order, replacing the previous fixed 8AM-10PM Nepal Time window.

## Changes Made

### 1. Frontend Changes

#### A. User Dashboard (`client/src/pages/user/UserDashboardPage.jsx`)

**Payment Window Modal:**
- Removed fixed 8AM-10PM Nepal Time logic
- Implemented dynamic window: **Current Time → Current Time + 2 Hours**
- Shows user's local time and timezone
- Displays clear warning about 2-hour payment deadline
- Always shows as "OPEN" since window starts when user clicks

**Order List with Countdown Timer:**
- Added real-time countdown for pending payments
- Shows remaining time in hours and minutes
- Color-coded warnings:
  - Yellow: More than 30 minutes remaining
  - Red: Less than 30 minutes remaining
  - Red with warning: Payment window expired
- Example display: "45m left to pay" or "1h 23m left to pay"

#### B. Helper Functions (`client/src/utils/helpers.js`)

Added three new utility functions:

```javascript
// Get dynamic payment window string
getPaymentWindow()
// Returns: "Payment Window: 02:30 PM - 04:30 PM"

// Check if payment is still valid
isPaymentValid(createdAt)
// Returns: true/false

// Get remaining minutes for payment
getPaymentTimeRemaining(createdAt)
// Returns: number of minutes (0 if expired)
```

### 2. Backend Changes

#### A. Request Model (`server/models/Request.js`)

Added new field:
```javascript
expiryTime: { type: Date, default: null }
```

This stores the exact expiry time (createdAt + 2 hours) for each order.

#### B. Request Controller (`server/controllers/requestController.js`)

**createRequest Function:**
- Automatically sets `expiryTime` to 2 hours from order creation
- Example: Order created at 2:00 PM → expiryTime = 4:00 PM

**updateRequestStatus Function:**
- Added payment window validation when admin tries to accept an order
- Checks if current time > expiryTime
- Returns error if payment window expired
- Error message includes how long ago the order was created
- Fallback to createdAt check for old orders without expiryTime

### 3. Key Features

✅ **Automatic Time Calculation**
- No manual time entry needed
- Works in any timezone
- Updates dynamically based on user's local time

✅ **Backend Validation**
- Prevents accepting expired payments
- Admin gets clear error message if trying to accept late payment
- Example: "Payment time expired. This order was created 3.2 hours ago. Payment must be completed within 2 hours of order creation."

✅ **User Experience**
- Clear countdown timer on pending orders
- Visual warnings as deadline approaches
- Expired orders clearly marked
- No confusion about payment windows

✅ **Production Ready**
- Handles timezone differences automatically
- Backward compatible (checks old orders without expiryTime)
- Prevents fraud (server-side validation)
- Database stores exact expiry time

## Example User Flow

1. **User clicks "Buy Now"** at 2:00 PM
   - Modal shows: "Payment Window: 02:00 PM - 04:00 PM"
   - Warning: "You have 2 hours from now to complete your payment"

2. **User submits order** at 2:05 PM
   - Order created with expiryTime = 4:05 PM
   - Order list shows: "🕐 1h 55m left to pay"

3. **User checks back** at 3:30 PM
   - Order list shows: "🕐 35m left to pay" (yellow warning)

4. **User checks back** at 3:50 PM
   - Order list shows: "🕐 15m left to pay" (red warning)

5. **Admin tries to accept** at 4:10 PM
   - Backend rejects: "Payment time expired. This order was created 2.1 hours ago."

## Benefits Over Previous System

| Previous (Fixed Window) | New (Dynamic Window) |
|------------------------|---------------------|
| 8AM-10PM Nepal Time only | Anytime, 2 hours from order |
| Timezone confusion | Works in all timezones |
| Users had to wait until 8AM | Instant ordering 24/7 |
| No countdown timer | Real-time countdown |
| No expiry tracking | Exact expiry stored in DB |
| Manual time checking | Automatic validation |

## Security & Compliance

✅ **Server-side validation** prevents bypassing time limits
✅ **Database storage** of expiry time prevents tampering
✅ **Backward compatible** with existing orders
✅ **Clear error messages** for admins and users
✅ **Automatic cleanup** possible (can add cron job to auto-reject expired orders)

## Future Enhancements (Optional)

1. **Auto-reject expired orders**: Add a cron job to automatically reject orders after 2 hours
2. **Email notifications**: Send reminder emails at 1 hour and 15 minutes remaining
3. **Configurable window**: Allow admin to change the 2-hour window duration
4. **Grace period**: Add a 15-minute grace period for edge cases
5. **Push notifications**: Browser notifications when payment deadline approaches

## Testing Checklist

- [x] Frontend displays dynamic time correctly
- [x] Countdown timer updates in real-time
- [x] Backend validates expiry time
- [x] Backend rejects expired payments
- [x] Works across different timezones
- [x] Old orders without expiryTime still work
- [x] Error messages are clear and helpful
- [x] UI shows expired orders clearly

## Code Quality

- Clean, readable code with comments
- No breaking changes to existing functionality
- Follows existing code patterns
- Type-safe date handling
- Proper error handling
- User-friendly messages
