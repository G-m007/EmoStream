#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

REPO_NAME="EC-Team-30-emostream-concurrent-emoji-broadcast-over-event-driven-architecture"

# Ensure the repository directory exists
if [ ! -d "$REPO_NAME" ]; then
    echo "Error: Repository directory '$REPO_NAME' not found. Please run the first script first."
    exit 1
fi

# Step into the repository directory
cd "$REPO_NAME"

# Function to open a new terminal based on OS
open_new_terminal_tab() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xterm -hold -e "$1" &  # Use xterm for Linux
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        osascript <<EOF
        tell application "Terminal"
            activate
            do script "$1"
        end tell
EOF
    elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* ]]; then
        start bash -c "$1"  # Use start for Git Bash on Windows
    else
        echo "Unsupported OS: $OSTYPE"
        exit 1
    fi
}

# Step into the backend directory
cd backend/

# Start the producer in a new terminal tab
open_new_terminal_tab "cd $(pwd); bun run producer.ts"

# Start the consumer in another terminal tab
open_new_terminal_tab "cd $(pwd); bun run consumer.ts group1"

# Go back to the root directory
cd ..

# Step into the emoji directory
cd emoji-analyzer/

# Set up and activate Python virtual environment
python3 -m venv .
source ./bin/activate

# Install required Python libraries
pip install pyspark websocket-client flask flask-cors

# Start the Python app in a new terminal tab
open_new_terminal_tab "cd $(pwd); source ./bin/activate; python3 spark_processor.py"

# Go back to the root directory
cd ..
bun install
# Start the frontend
bun run dev
