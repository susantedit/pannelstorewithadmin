You are a senior full-stack developer. Debug and fix my full-stack web application. Provide complete, working, production-ready code and clear explanations.

---

## 🔴 Critical Issues to Fix

### 1. Request Not Reaching Admin Panel

* User actions (form submissions / service requests) are not दिखाई in the admin dashboard.
* Fix:

  * Frontend API calls (fetch/axios: URL, method, headers, body)
  * Backend routes (Express/Firebase functions/etc.)
  * Database write logic
* Ensure submitted data is:
  **User → API → Server → Database → Admin Panel (visible in real-time or refresh)**

---

### 2. XP System Not Increasing

* XP should increase when users:

  * Submit a request
  * Complete an action (define clearly in code)
* Fix:

  * Backend logic for XP increment
  * Database update queries
  * Prevent duplicate XP (e.g., double-click issues)
* Ensure:

  * XP updates instantly in UI after action
  * XP persists after reload

---

### 3. Notifications Not Working

* Notifications are not being triggered or displayed.

Fix complete notification system:

* Backend:

  * Create notification on events (e.g., request submitted, XP gained)
* Frontend:

  * Fetch and display notifications
  * Mark as read system
* Add **real-time updates** using:

  * WebSocket (Socket.io) OR
  * Polling fallback

---

## 🆕 4. Admin Custom Notification Feature (IMPORTANT)

Add a system where:

* Admin can:

  * Send custom notifications to:

    * Specific user
    * All users (broadcast)
* Backend:

  * API route: `/admin/send-notification`
  * Store notification in database
* Frontend:

  * Admin panel UI (form: message, target user/all)
  * User UI receives and displays it
* Real-time delivery required

---

## ⚙️ Requirements

* Debug BOTH frontend and backend
* Ensure all APIs are correctly connected
* Validate database schema (fix if needed)
* Add:

  * Proper error handling
  * Console logs for debugging
* Prevent:

  * Duplicate requests
  * Race conditions
* Optimize performance
* Keep code modular and clean

---

## 📦 Output Format

### 1. Root Cause Analysis

Explain WHY each issue was happening:

* API mismatch?
* Missing await?
* Wrong DB query?
* State not updating?

---

### 2. Fixed Backend Code

* Routes
* Controllers
* Models / schema
* Notification + XP logic

---

### 3. Fixed Frontend Code

* API calls
* State management
* Admin panel UI
* Notification UI

---

### 4. Data Flow (VERY IMPORTANT)

Show clearly:
User Action → API Request → Backend → Database → Admin Panel → Notification → UI Update

---

### 5. Improvements (Optional but Recommended)

* Security (auth, validation)
* Performance
* Scalability

---

## 🧠 Tech Stack

(Replace with your actual stack)
Example:

* Frontend: HTML, CSS, JavaScript (or React)
* Backend: Node.js + Express
* Database: MongoDB / Firebase

---

## ⚠️ Final Requirement

Everything MUST work end-to-end:
✔ Request visible in admin panel
✔ XP updates instantly
✔ Notifications work (real-time)
✔ Admin can send custom notifications

Do NOT give partial fixes. Provide COMPLETE working implementation.
