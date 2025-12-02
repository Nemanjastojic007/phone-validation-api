# ⚠️ IMPORTANT: How to Run This Site Locally

## ❌ Don't Do This:
Opening `index.html` directly in Finder by double-clicking it **WON'T WORK**

The gray window you see is because:
- PayPal requires HTTPS or localhost (not `file://` protocol)
- API endpoints need a server to run
- Nothing will work without a proper server

## ✅ Do This Instead:

### Quick Setup (2 minutes):

1. **Open Terminal** (Applications → Utilities → Terminal)

2. **Navigate to your project:**
   ```bash
   cd /Users/nemanjastojic/Desktop/phone-validation-api
   ```

3. **Install Vercel CLI** (one-time setup):
   ```bash
   npm install -g vercel
   ```
   
   If you don't have Node.js, download it first: https://nodejs.org/

4. **Create `.env` file** with your PayPal credentials:
   ```bash
   cat > .env << 'EOF'
   PAYPAL_CLIENT_ID=AW3JRtbEuYVYkXdGpoTckLHYPEIOAuaGRjSfCFkTh6vg5bBtbvEMOHCuLjpGaNyIJ-L2UqpwaJnFFjwH
   PAYPAL_CLIENT_SECRET=EEXX9nmxWJdwPtA2lHSZrLa9Y9_MvRvIOpmsLjBwIIxS64whXMcGJsec1eJnYCPFlEPoO9D1EeJnaCt0
   PAYPAL_MODE=sandbox
   EOF
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```
   
   Or:
   ```bash
   vercel dev
   ```

6. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

Now everything will work! 🎉

---

## Why You Need a Server

This project uses:
- ✅ Serverless API functions (need a server)
- ✅ PayPal SDK (requires HTTPS/localhost)
- ✅ Environment variables (need server to load)
- ✅ File system access (needs server)

All of these require a proper server, not just opening an HTML file.

---

## Still Having Issues?

Check out `LOCAL_DEVELOPMENT.md` for more detailed instructions and troubleshooting.

