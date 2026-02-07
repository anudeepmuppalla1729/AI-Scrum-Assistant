#!/bin/bash

# Function to handle script termination
cleanup() {
    echo "Stopping all services..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID
    fi
    exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Navigate to the script's directory and then to the project root
# This ensures the script works regardless of where it is called from
cd "$(dirname "$0")/.."

echo "Starting Backend..."
cd backend
npm run dev &
BACKEND_PID=$!

echo "Starting Frontend..."
# Navigate back to root then to frontend, or just relative from backend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
