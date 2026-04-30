# Installation Guide - Smart Payment Request System

## Issue Encountered

npm installs are taking longer than expected on Windows due to path length and network issues. This is a known issue with npm on Windows systems.

## Quick Fix - Use Shorter Path

Copy the project to a shorter path to avoid npm issues:

```powershell
# Copy project to shorter path
Copy-Item -Recurse "d:\pannelstorewithadmin" "C:\app"
cd C:\app
```

## Install Dependencies

### Install Server Dependencies
```powershell
cd server
npm install
```

### Install Client Dependencies  
```powershell
cd ..\client
npm install
```

## Run the Application

### Terminal 1 - Start Backend
```powershell
cd C:\app\server
npm start
```
✅ Backend will run on http://localhost:5000

### Terminal 2 - Start Frontend
```powershell
cd C:\app\client
npm run dev
```
✅ Frontend will run on http://localhost:5173

## Login Credentials (Demo)

- **Email:** demo@example.com
- **Password:** demo123

Toggle between **User** and **Admin** modes on the login page.

## What to Test

### User Flow:
1. Go to http://localhost:5173
2. Click "Get started" or "Browse products"
3. Log in as user (use demo credentials)
4. Click "Buy now" on a product
5. Follow the workflow: Confirmation → Form → QR Timer (10s) → Processing (5m)
6. Track your requests on the dashboard

### Admin Flow:
1. Go to http://localhost:5173/login
2. Toggle to "Admin login"
3. Log in with demo credentials
4. View request queue with filters
5. Click a request to view details
6. Approve/Reject or search requests

## Environment Variables

### Server (.env)
```
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
NODE_ENV=development
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000
```

## Troubleshooting

### npm install hangs
- Kill the process (Ctrl+C)
- Clear cache: `npm cache clean --force`
- Try shorter path: `C:\app` instead of `d:\pannelstorewithadmin`
- Add flags: `npm install --legacy-peer-deps`

### Port already in use
- Backend: Change PORT in server/.env
- Frontend: Vite will automatically use next available port

### Module not found errors
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

---

**Total Build Time:** ~4-5 minutes (including npm install on first run)
**Build Status:** ✅ Code complete | ⏳ Dependencies installing
