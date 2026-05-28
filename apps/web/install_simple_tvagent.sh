#!/bin/bash

# PlaySync TV Agent Installer
# Usage: sudo ./install_simple_tvagent.sh <DEVICE_ID> <DEVICE_TOKEN>

DEVICE_ID=$1
DEVICE_TOKEN=$2
SERVER_URL="http://10.1.191.107:3000" # Default server URL (can be changed)

if [ -z "$DEVICE_ID" ] || [ -z "$DEVICE_TOKEN" ]; then
    echo "Usage: sudo ./install_simple_tvagent.sh <DEVICE_ID> <DEVICE_TOKEN>"
    echo "Example: sudo ./install_simple_tvagent.sh dev_123 token_abc"
    exit 1
fi

echo "Installing PlaySync TV Agent for Device: $DEVICE_ID"

# 1. Install System Dependencies
echo "Step 1: Installing Dependencies..."
if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get install -y python3 python3-pip python3-venv vlc
elif command -v yum &> /dev/null; then
    yum install -y python3 python3-pip vlc
else
    echo "Unsupported package manager. Please install python3, pip, and vlc manually."
fi

# 2. Create Directory
echo "Step 2: Creating Application Directory..."
INSTALL_DIR="/opt/sgti-tvagent"
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

# 3. Create Virtual Environment
echo "Step 3: Setting up Python Environment..."
python3 -m venv venv
source venv/bin/activate

# 4. Install Python Libraries
pip install requests python-vlc psutil screed

# 5. Write Agent Code
echo "Step 4: Writing Agent Code..."
cat << 'EOF' > main.py
import time
import sys
import json
import requests
import vlc
import psutil
import platform
import os
from datetime import datetime

# Configuration
if len(sys.argv) < 3:
    print("Error: Missing Device ID or Token", flush=True)
    sys.exit(1)

DEVICE_ID = sys.argv[1]
DEVICE_TOKEN = sys.argv[2]
SERVER_URL = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:3000"

HEARTBEAT_URL = f"{SERVER_URL}/api/agent/heartbeat"

print(f"Starting PlaySync Agent for {DEVICE_ID}", flush=True)
print(f"Server: {SERVER_URL}", flush=True)

# VLC Instance
# Use dummy audio/video if headless/error to prevent crash loop, but standard flags usually work
try:
    vlc_instance = vlc.Instance('--no-xlib --fullscreen --quiet')
    player = vlc_instance.media_player_new()
    player.set_fullscreen(True)
    print("VLC Initialized", flush=True)
except Exception as e:
    print(f"VLC Init Error (Non-Fatal): {e}", flush=True)

current_playlist_id = None
media_list = []
current_media_index = 0

def get_system_metrics():
    try:
        return {
            "cpu": psutil.cpu_percent(interval=None),
            "memory": psutil.virtual_memory().percent,
            "disk": psutil.disk_usage('/').percent,
            "uptime": int(time.time() - psutil.boot_time())
        }
    except:
        return {}

def heartbeat():
    global current_playlist_id
    
    metrics = get_system_metrics()
    
    payload = {
        "deviceId": DEVICE_ID,
        "token": DEVICE_TOKEN,
        "status": "online",
        "metrics": metrics
    }
    
    try:
        headers = {'Authorization': f'Bearer {DEVICE_TOKEN}'}
        response = requests.post(HEARTBEAT_URL, json=payload, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            # print(f"Heartbeat success: {data}", flush=True)
            
            # Check for commands or playlist updates
            if "command" in data:
                cmd = data["command"]
                if cmd == "REBOOT":
                    os.system("reboot")
                elif cmd == "RELOAD":
                    sys.exit(0) # Systemd will restart
            
        else:
            print(f"Heartbeat failed: {response.status_code}", flush=True)
            
    except Exception as e:
        print(f"Connection error to {HEARTBEAT_URL}: {e}", flush=True)

def main():
    print("Agent Running...", flush=True)
    while True:
        heartbeat()
        time.sleep(10) # 10 second interval

if __name__ == "__main__":
    main()
EOF

# 6. Create Service Config
echo "Step 5: writing config..."
cat << EOF > config.json
{
    "deviceId": "$DEVICE_ID",
    "token": "$DEVICE_TOKEN",
    "serverUrl": "$SERVER_URL"
}
EOF

# 7. Create Systemd Service
echo "Step 6: Installing Systemd Service..."
SERVICE_FILE="/etc/systemd/system/sgti-player.service"

cat << EOF > $SERVICE_FILE
[Unit]
Description=PlaySync Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/venv/bin/python3 -u $INSTALL_DIR/main.py $DEVICE_ID $DEVICE_TOKEN $SERVER_URL
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 8. Enable and Start
echo "Step 7: Starting Service..."
systemctl daemon-reload
systemctl enable sgti-player
systemctl restart sgti-player

echo "------------------------------------------------"
echo "Installation Complete!"
echo "Device ID: $DEVICE_ID"
echo "Service Status: systemctl status sgti-player"
echo "------------------------------------------------"
