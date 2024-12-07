#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

REPO_URL="https://github.com/Cloud-Computing-Big-Data/EC-Team-30-emostream-concurrent-emoji-broadcast-over-event-driven-architecture.git"
REPO_NAME="EC-Team-30-emostream-concurrent-emoji-broadcast-over-event-driven-architecture"

# Clone the repository if it doesn't already exist
if [ ! -d "$REPO_NAME" ]; then
    echo "Cloning repository..."
    git clone "$REPO_URL"
else
    echo "Repository already exists. Skipping cloning."
fi

# Step into the repository directory
cd "$REPO_NAME"

echo "Repository cloned. Please make necessary changes to the IP addresses or configurations."
echo "Once done, run the second script to continue the setup process."
