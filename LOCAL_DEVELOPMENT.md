# 🚀 How to Run Locally (The Right Way)

## ❌ Why Opening index.html Directly Doesn't Work

Opening `index.html` by double-clicking in Finder won't work because:
- ❌ PayPal requires HTTPS or localhost (not `file://`)
- ❌ API endpoints need a server to run
- ❌ Gray window appears because PayPal can't load

## ✅ Solution: Use Vercel CLI (Recommended)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Or if you don't have Node.js installed, install it first:
- Download from: https://nodejs.org/

### Step 2: Set Up Environment Variables

Create a `.env` file in your project root:

```bash
cd /Users/nemanjastojic/Desktop/phone-validation-api
touch .env
```

Add these lines to `.env`:
```
PAYPAL_CLIENT_ID=AW3JRtbEuYVYkXdGpoTckLHYPEIOAuaGRjSfCFkTh6vg5bBtbvEMOHCuLjpGaNyIJ-L2UqpwaJnFFjwH
PAYPAL_CLIENT_SECRET=EEXX9nmxWJdwPtA2lHSZrLa9Y9_MvRvIOpmsLjBwIIxS64whXMcGJsec1eJnYCPFlEPoO9D1EeJnaCt0
PAYPAL_MODE=sandbox
```

### Step 3: Run Local Server

```bash
vercel dev
```

This will:
- ✅ Start a local server (usually on http://localhost:3000)
- ✅ Run your API endpoints
- ✅ Make PayPal work properly
- ✅ Enable all features

### Step 4: Open in Browser

Open: **http://localhost:3000**

Now everything should work! 🎉

---

## 🔧 Alternative: Simple HTTP Server (Quick Test)

If you just want to quickly view the HTML (but API won't work):

### Option A: Python (if installed)
```bash
cd /Users/nemanjastojic/Desktop/phone-validation-api
python3 -m http.server 8000
```
Then open: http://localhost:8000

### Option B: Node.js http-server
```bash
npm install -g http-server
cd /Users/nemanjastojic/Desktop/phone-validation-api
http-server -p 8000
```
Then open: http://localhost:8000

**⚠️ Note:** This only works for viewing HTML. PayPal and API endpoints still won't work without Vercel CLI.

---

## 📋 Complete Setup Checklist

- [ ] Install Node.js (if not already installed)
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Create `.env` file with PayPal credentials
- [ ] Run `vercel dev` in project directory
- [ ] Open http://localhost:3000 in browser
- [ ] Test PayPal button - it should work now!

---

## 🐛 Troubleshooting

**Problem:** `vercel: command not found`
- **Fix:** Install Vercel CLI: `npm install -g vercel`

**Problem:** Port 3000 already in use
- **Fix:** Vercel will automatically use another port (like 3001)

**Problem:** PayPal still shows gray window
- **Fix:** Make sure you're accessing via `localhost:3000`, not `file://`

**Problem:** API endpoints return 404
- **Fix:** Make sure you're running `vercel dev`, not just opening HTML file

---

## 💡 Best Practice

**Always use `vercel dev` for local development!**

This ensures:
- ✅ All API endpoints work
- ✅ PayPal integration works
- ✅ Environment variables load
- ✅ Everything works like production

