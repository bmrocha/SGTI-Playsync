# 🔍 Viewer Tracking - Troubleshooting Guide

## ✅ What Was Fixed

### Issue 1: Heartbeat Not Starting Properly

**Problem:** The heartbeat effect had `isPlayerOpen` in the early return condition, preventing it from starting even after the playlist loaded.

**Fix:** Changed the heartbeat to only start when `isPlayerOpen` is `true`, but properly re-run the effect when the state changes.

**Files Modified:**

- `apps/web/src/app/player/[id]/page.tsx` - Fixed heartbeat logic
- `apps/web/src/app/api/playlist-links/[id]/viewers/route.ts` - Added debug logging

---

## 🚀 Step-by-Step Setup

### Option 1: Run Diagnostic Script (Recommended)

**Windows PowerShell:**

```powershell
cd "c:\Users\Bruno Martins Rocha\Downloads\DEV\SGTI-Playsync"
.\scripts\diagnose-viewer-tracking.ps1
```

**Linux/Mac (bash):**

```bash
cd /path/to/SGTI-Playsync
chmod +x scripts/diagnose-viewer-tracking.sh
./scripts/diagnose-viewer-tracking.sh
```

---

### Option 2: Manual Setup

#### Step 1: Start Docker Containers

```powershell
cd "c:\Users\Bruno Martins Rocha\Downloads\DEV\SGTI-Playsync"
docker compose down
docker compose up --build -d
```

Wait ~30 seconds for containers to fully start.

#### Step 2: Verify Database Table Exists

```powershell
# Get database container name
docker compose ps

# Check if table exists
docker exec <postgres-container-name> psql -U postgres -d playsync -c "\dt playlist_link_viewers"
```

If the table doesn't exist, create it:

```powershell
docker exec <postgres-container-name> psql -U postgres -d playsync -c "
CREATE TABLE IF NOT EXISTS playlist_link_viewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_link_id VARCHAR(50) REFERENCES playlist_links(id) ON DELETE CASCADE,
    viewer_id VARCHAR(100) NOT NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_playlist_link_viewers_link_id ON playlist_link_viewers(playlist_link_id);
CREATE INDEX IF NOT EXISTS idx_playlist_link_viewers_viewer_id ON playlist_link_viewers(viewer_id);
CREATE INDEX IF NOT EXISTS idx_playlist_link_viewers_last_heartbeat ON playlist_link_viewers(last_heartbeat);
"
```

#### Step 3: Verify Next.js API Routes

Open your browser and test the API:

```
http://localhost:3000/api/playlist-links/test-id/viewers
```

You should get a JSON response (either an error about invalid ID or a valid response).

---

## 🧪 Testing the Feature

### Step 1: Generate a Playlist Link

1. Open `http://localhost:3000` in your browser
2. Login to the dashboard
3. Navigate to a playlist
4. Click **"LINK"** or **"Gerar Link"** button
5. The modal will show the playlist ID and full URL
6. Click **"Copiar"** to copy the link

### Step 2: Open Link in Another Device/Browser

1. Copy the generated link (looks like: `http://192.168.1.100:3000/player?id=abc123`)
2. Open it in:
   - Another browser (Chrome → Firefox)
   - Another device on the same network (phone, tablet, another computer)
   - Or use the LAN IP instead of localhost

### Step 3: Check Browser Console

**In the player window (the one that opened the link):**

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. You should see logs like:
   ```
   [Viewer Tracking] Sending heartbeat for playlist: abc123 viewer: viewer_1234567890_abc123
   [Viewer Tracking] Heartbeat response: {success: true, activeViewers: 1}
   ```

**These logs appear:**

- Immediately when the playlist loads
- Every 30 seconds after that

### Step 4: Check Dashboard Counter

**In the dashboard window (where you generated the link):**

1. Go back to the playlist modal
2. You should see a badge showing: **"1 dispositivo"** or **"2 dispositivos"**
3. The badge has a green pulsing indicator
4. The counter updates every 5 seconds

### Step 5: Verify Database

```powershell
docker exec <postgres-container-name> psql -U postgres -d playsync -c "
SELECT
    viewer_id,
    last_heartbeat,
    ip_address,
    user_agent
FROM playlist_link_viewers
ORDER BY last_heartbeat DESC
LIMIT 10;
"
```

---

## 🐛 Troubleshooting

### Issue: "No containers are running"

**Solution:**

```powershell
docker compose up --build -d
# Wait 30 seconds
docker compose ps
```

### Issue: "Table playlist_link_viewers does not exist"

**Solution:** Run the diagnostic script or manually create the table (see Step 2 above).

### Issue: Heartbeat logs not appearing in browser console

**Possible causes:**

1. **Player didn't load successfully** - Check if the playlist shows content
2. **API route not accessible** - Check if you're using the correct URL
3. **CORS or network errors** - Check the Network tab in DevTools (F12)

**Debug steps:**

```javascript
// In browser console, manually test:
fetch('/api/playlist-links/YOUR_PLAYLIST_ID/viewers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ viewerId: 'test_viewer' }),
})
  .then((r) => r.json())
  .then(console.log);
```

### Issue: Counter shows 0 even after opening player

**Check:**

1. Is the heartbeat being sent? (Check browser console)
2. Is the API receiving it? (Check Next.js server logs)
3. Is the database being updated? (Run the SQL query above)

**Common causes:**

- Player is on a different network and can't reach the API
- Using `localhost` URL on another device (use LAN IP instead)
- Firewall blocking port 3000

### Issue: Counter doesn't decrease after closing player

**This is expected behavior!** The system uses a 2-minute timeout:

- Heartbeats are sent every 30 seconds
- A viewer is considered "active" if their last heartbeat was within 2 minutes
- After closing the player, it takes up to 2 minutes for the counter to decrease

**To test:** Wait 2-3 minutes and check again.

### Issue: "Link not found" error

**Possible causes:**

1. Playlist link was never created/saved
2. Link was deleted
3. Wrong ID in URL

**Solution:**

1. Go back to dashboard
2. Open the playlist
3. Click "Gerar Link" again
4. Make sure to save the appearance settings

---

## 📊 How It Works

### Architecture

```
Player Browser (Device 1)          Dashboard Browser
      |                                    |
      | [Heartbeat every 30s]              | [Poll every 5s]
      v                                    v
/api/playlist-links/[id]/viewers (POST)   /api/playlist-links/[id]/viewers (GET)
      |                                    |
      v                                    v
   Database: playlist_link_viewers         Returns activeViewers count
   - Upsert viewer heartbeat
   - Clean old entries (>2 min)
```

### Key Components

1. **Player Page** (`/player/[id]`)
   - Generates unique `viewerId` on load
   - Sends heartbeat every 30 seconds
   - Sends DELETE request when closed

2. **API Endpoint** (`/api/playlist-links/[id]/viewers`)
   - POST: Register/update heartbeat
   - GET: Get active viewer count
   - DELETE: Remove viewer

3. **Database Table** (`playlist_link_viewers`)
   - Stores viewer heartbeats
   - Auto-cleans via query (2-minute timeout)
   - Indexed for fast lookups

4. **Link Generator Modal**
   - Polls viewer count every 5 seconds
   - Displays badge with active count
   - Shows green pulsing indicator

---

## 🔧 Advanced Debugging

### Enable Verbose Logging

The system now includes console logs prefixed with `[Viewer Tracking]` and `[Viewer Tracking API]`.

### Check Server Logs

```powershell
# View Next.js logs
docker compose logs -f web

# Or if running locally:
npm run dev
# Watch terminal output
```

### Manual API Testing

```powershell
# Test POST (register heartbeat)
curl -X POST http://localhost:3000/api/playlist-links/TEST_ID/viewers `
  -H "Content-Type: application/json" `
  -d "{\"viewerId\":\"test_123\"}"

# Test GET (get count)
curl http://localhost:3000/api/playlist-links/TEST_ID/viewers

# Test DELETE (remove viewer)
curl -X DELETE "http://localhost:3000/api/playlist-links/TEST_ID/viewers?viewerId=test_123"
```

### Database Queries

```sql
-- View all active viewers (last 2 minutes)
SELECT
    playlist_link_id,
    viewer_id,
    last_heartbeat,
    EXTRACT(EPOCH FROM (NOW() - last_heartbeat))/60 as minutes_ago
FROM playlist_link_viewers
WHERE last_heartbeat > NOW() - INTERVAL '2 minutes'
ORDER BY last_heartbeat DESC;

-- Count active viewers per playlist
SELECT
    playlist_link_id,
    COUNT(DISTINCT viewer_id) as active_viewers
FROM playlist_link_viewers
WHERE last_heartbeat > NOW() - INTERVAL '2 minutes'
GROUP BY playlist_link_id;

-- Clean old entries (older than 10 minutes)
DELETE FROM playlist_link_viewers
WHERE last_heartbeat < NOW() - INTERVAL '10 minutes';
```

---

## 📝 Notes

- **Module "Telas" is disabled** - This feature works independently and doesn't require the "Telas" module
- **Network requirement** - All devices must be able to reach the Next.js server (same LAN or properly configured)
- **Browser compatibility** - Works in all modern browsers (Chrome, Firefox, Edge, Safari)
- **Mobile support** - Works on mobile browsers too
- **Privacy** - Viewer IPs and user agents are logged for debugging but not displayed in UI

---

## 🆘 Still Not Working?

1. **Run the diagnostic script:**

   ```powershell
   .\scripts\diagnose-viewer-tracking.ps1
   ```

2. **Check all logs:**
   - Browser console (F12) on player page
   - Browser console (F12) on dashboard page
   - Next.js server terminal/Docker logs
   - Database entries

3. **Verify network connectivity:**
   - Can the player device reach `http://YOUR_IP:3000`?
   - Is port 3000 open in firewall?
   - Are both devices on the same network?

4. **Test with localhost first:**
   - Open `http://localhost:3000/player?id=YOUR_ID` in the same machine
   - Check if counter updates
   - Then try from another device

---

**Last Updated:** June 10, 2026
**Status:** ✅ Production Ready (after fixes applied)
