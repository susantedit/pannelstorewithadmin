Smart Payment Request System

1. Product Vision

Build two connected experiences:

- A customer-facing website for browsing products, starting a timed payment request, and tracking status.
- An admin dashboard for reviewing requests, approving or rejecting them, and delivering the final key/message.

The system should feel premium, fast, and controlled. The UI should look expensive, not generic, and should guide the user step by step through a clear payment workflow.

2. Brand Direction

Color palette:

- Primary: #2F2FE4
- Secondary: #162E93
- Deep accent: #1A1953
- Base dark: #080616
- Supporting RGB tones:
	- rgb(47, 47, 228)
	- rgb(22, 46, 147)
	- rgb(26, 25, 83)
	- rgb(8, 6, 22)

Theme style:

- Modern dark navy system.
- High contrast, glass-like surfaces, subtle glow, and soft gradients.
- Spacious layout with strong hierarchy.
- Minimal but luxurious motion.

Visual rules:

- Use dark backgrounds with blue highlights.
- Prefer soft shadows, blurred panels, and thin borders.
- Keep forms clean and focused.
- Use status colors sparingly so the blue palette remains dominant.

3. Information Architecture

The app should be split into clear zones:

- Public area: landing, login, product discovery.
- User area: dashboard, request creation, payment flow, request status.
- Admin area: request review, product management, settings, user history.

The customer and admin experiences should be separated in both routing and folder structure.

4. Core Workflow

User flow:

1. User opens the website and signs in with Google.
2. User lands on a clean dashboard with available products.
3. User selects a product and taps Buy Now.
4. A warning modal explains the payment window and next steps.
5. User confirms and enters required details:
	 - Name
	 - TikTok name
	 - WhatsApp number
	 - Transaction number
6. The QR payment screen appears with a 10-second timer.
7. After the 10-second step, the request moves into the 5-minute admin-check stage.
8. When the 5-minute stage completes, the request is sent to the admin panel.
9. The user sees live status updates: pending, under review, accepted, rejected, or delivered.
10. If approved, the user receives the key/message in the dashboard.

Admin flow:

1. Admin logs into the admin dashboard.
2. Admin sees all pending and active requests in a structured queue.
3. Each request opens into a detail panel with user info, payment status, and timers.
4. Admin accepts or rejects the request.
5. If accepted, admin sends the key/message to the user.
6. Every request keeps its own status history so multiple requests are handled independently.

5. UI/UX Flow Requirements

Every screen should answer one question and lead to one next action.

- Login screen: sign in with Google and reassure the user.
- Product screen: show cards, price, short description, and trust cues.
- Buy confirmation modal: explain the time window and consequences clearly.
- Request form: short, single-column, mobile-first, low friction.
- QR payment screen: strong timer, focused layout, one primary action.
- Processing screen: show progress, not confusion.
- Status dashboard: show current state, history, and next expected step.
- Admin queue: prioritize urgency, filter, and review quickly.

UX principles:

- Make the next action obvious.
- Reduce clutter during payment steps.
- Use clear status labels and strong timer visibility.
- Keep the admin interface information-dense but readable.
- Design for mobile first, then expand to desktop.

6. Page Structure

Public pages:

- Landing page
- Login page
- Product preview page

User pages:

- User dashboard
- Product details page
- Buy now confirmation modal
- Request form page
- QR payment page
- Payment processing page
- Request history page
- Request detail page

Admin pages:

- Admin login page
- Admin dashboard
- Requests table
- Request detail drawer or page
- Product management page
- User management page
- Settings page

7. Folder Structure

Recommended structure for a React-based app:

```text
src/
	app/
		public/
		user/
		admin/
	components/
		shared/
		layout/
		feedback/
		forms/
		modals/
		timers/
		cards/
	features/
		auth/
		products/
		orders/
		payments/
		requests/
		notifications/
	services/
		api/
		auth/
		storage/
		websocket/
	hooks/
	utils/
	types/
	styles/
	assets/
	constants/
```

Folder rules:

- Put shared UI in components/shared.
- Put layout shells in components/layout.
- Put role-specific screens in app/user and app/admin.
- Keep business logic in features.
- Keep API calls in services.
- Keep reusable helper logic in utils.

8. Feature Organization

Shared components:

- Button
- Input
- Modal
- Badge
- Card
- Table
- Tabs
- Avatar
- Timer display
- Status pill

User-specific features:

- Product catalog
- Buy flow
- QR countdown
- Request submission
- Request tracking
- Key/message display

Admin-specific features:

- Request moderation
- Request assignment
- Product CRUD
- User lookup
- Approval/rejection actions
- Audit history

9. Data Model

Main entities:

- User
- Admin
- Product
- Order or Request
- Payment
- Notification
- Message or KeyDelivery

Request states:

- Draft
- Pending payment
- QR active
- Awaiting admin review
- Accepted
- Rejected
- Delivered
- Expired

10. Timing Rules

Payment flow timing:

- QR display step: 10 seconds.
- Admin review step: 5 minutes.
- If the user does not finish the payment window, mark the request expired.
- If the admin does not respond in time, keep the request visible but flagged as overdue.

Timer behavior:

- Show a live countdown everywhere it matters.
- Stop the flow cleanly when time ends.
- Save the timer state so refreshes do not break the request.

11. Interaction Rules

- Use confirmation modals only for irreversible actions.
- Use toast or inline feedback for minor actions.
- Disable buttons during active submission.
- Show empty states instead of blank pages.
- Show loading skeletons for request lists and product cards.

12. Admin Experience Rules

- Make the admin dashboard density high but visually calm.
- Prioritize pending requests at the top.
- Allow quick filtering by status, user, and product.
- Keep one request isolated at a time so actions never feel ambiguous.
- Show full request history before approve/reject actions.

13. Security And Trust

- Use Google authentication for user sign-in.
- Protect admin routes separately.
- Validate request data on both client and server.
- Store all status changes in an audit trail.
- Avoid exposing private keys or payment data publicly.

14. Technical Architecture

Frontend:

- React
- TypeScript
- Route-based role separation
- Reusable component library

Backend:

- Node.js
- Express
- REST API
- Optional WebSocket or realtime layer for status updates

Database:

- MongoDB

Deployment:

- Frontend: Vercel or similar
- Backend: Railway or Render
- Database: MongoDB Atlas

15. MVP Build Order

Phase 1:

- Finalize routes and folder structure.
- Build theme tokens and base UI components.
- Build Google login and session protection.
- Build product list and request creation.

Phase 2:

- Build QR payment timer flow.
- Build request status tracking.
- Build admin dashboard queue.
- Build accept/reject actions.

Phase 3:

- Add key/message delivery.
- Add realtime updates.
- Add product management.
- Add audit logs and refinement.

16. Open Decisions

These still need confirmation before coding:

- Should admin be a separate domain or the same app under /admin?
- Should products be fixed or editable from admin?
- Should the QR be static or generated per transaction?
- Should notifications go to dashboard only or also WhatsApp/email?
- Should expired requests allow retry automatically?

17. Next Documentation Step

After this plan, the next document should be a screen-by-screen UI specification with:

- exact page layouts
- component lists for each page
- mobile and desktop behavior
- button states
- status labels
- empty states
- error states

18. Extra Updates And Upgrades

Add these improvements to make the system feel more complete and premium without adding automatic payment verification:

- Better dashboard summary cards for total orders, pending requests, approved requests, rejected requests, and expired requests.
- Search and filter tools for product, status, user name, TikTok name, WhatsApp number, and transaction number.
- A clean request timeline so user and admin both see each step in order.
- Strong empty states and no-data states for first-time users.
- Better mobile layout so the whole flow works smoothly on small screens.
- Dark premium theme tokens for buttons, cards, modals, borders, and timers.
- Consistent spacing system so every screen feels aligned and structured.
- Reusable toast messages for success, warning, and error feedback.
- Admin quick actions for accept, reject, message, and archive.
- Request history page for each user with status and timestamps.
- Better loading states such as skeleton cards and shimmer placeholders.
- Better security by separating user and admin routes clearly.
- Basic audit log for every status change and manual action.
- Product management improvements so items, prices, and labels can be edited later.
- Optional notifications inside the app when request status changes.
- Manual payment confirmation remains the process for now; do not add automatic payment verification.

