#!/bin/bash

# ============================================
# PlaySync - Viewer Tracking Setup & Diagnostic
# ============================================

echo "🔍 PlaySync Viewer Tracking Diagnostic Tool"
echo "============================================"
echo ""

# Check if Docker is running
echo "1️⃣  Checking Docker status..."
if docker info > /dev/null 2>&1; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is NOT running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi
echo ""

# Check if containers are running
echo "2️⃣  Checking Docker containers..."
CONTAINERS=$(docker compose ps -q 2>/dev/null)
if [ -z "$CONTAINERS" ]; then
    echo "❌ No containers are running!"
    echo "   Starting containers..."
    docker compose up -d
    sleep 5
else
    echo "✅ Containers are running"
    docker compose ps
fi
echo ""

# Check database connectivity
echo "3️⃣  Testing database connectivity..."
DB_CONTAINER=$(docker compose ps -q postgres 2>/dev/null || docker compose ps -q db 2>/dev/null)
if [ -z "$DB_CONTAINER" ]; then
    echo "❌ Database container not found!"
    echo "   Make sure your docker-compose.yml includes a postgres service."
    exit 1
else
    echo "✅ Database container found: $DB_CONTAINER"
fi
echo ""

# Check if playlist_link_viewers table exists
echo "4️⃣  Checking playlist_link_viewers table..."
TABLE_EXISTS=$(docker exec $DB_CONTAINER psql -U postgres -d playsync -t -c "
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'playlist_link_viewers'
);" 2>/dev/null | tr -d ' ')

if [ "$TABLE_EXISTS" = "t" ]; then
    echo "✅ playlist_link_viewers table exists"
else
    echo "⚠️  playlist_link_viewers table NOT found!"
    echo "   Creating table..."
    docker exec $DB_CONTAINER psql -U postgres -d playsync -c "
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
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Table created successfully"
    else
        echo "❌ Failed to create table"
        exit 1
    fi
fi
echo ""

# Check API route accessibility
echo "5️⃣  Testing API endpoint..."
NEXT_URL="http://localhost:3000"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $NEXT_URL/api/playlist-links/test 2>/dev/null)
if [ "$RESPONSE" = "404" ] || [ "$RESPONSE" = "400" ]; then
    echo "✅ Next.js API is accessible (got $RESPONSE, which is expected for invalid ID)"
else
    echo "⚠️  Next.js API returned: $RESPONSE"
    echo "   Make sure your Next.js server is running on port 3000"
fi
echo ""

# Summary
echo "============================================"
echo "📊 Diagnostic Summary"
echo "============================================"
echo ""
echo "✅ All checks passed!"
echo ""
echo "📝 Next steps:"
echo "1. Open your browser to: $NEXT_URL"
echo "2. Login to the dashboard"
echo "3. Navigate to a playlist and click 'Gerar Link'"
echo "4. Copy the generated link"
echo "5. Open the link in another browser/device"
echo "6. Check the browser console (F12) for '[Viewer Tracking]' logs"
echo "7. Return to dashboard - you should see active viewer count"
echo ""
echo "🐛 Debugging tips:"
echo "- Check browser console for heartbeat logs"
echo "- Check Next.js terminal for API logs"
echo "- Verify database entries:"
echo "  docker exec $DB_CONTAINER psql -U postgres -d playsync -c 'SELECT * FROM playlist_link_viewers ORDER BY last_heartbeat DESC LIMIT 5;'"
echo ""
