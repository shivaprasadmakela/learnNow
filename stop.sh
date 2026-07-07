#!/bin/bash

echo "Shutting down active servers..."

# Kill backend process listening on 8080
BACKEND_PORT_PID=$(lsof -t -i :8080)
if [ -n "$BACKEND_PORT_PID" ]; then
    echo "Stopping backend process on port 8080 (PID $BACKEND_PORT_PID)..."
    kill -TERM $BACKEND_PORT_PID 2>/dev/null
    sleep 1
    # Force kill if still running
    if kill -0 $BACKEND_PORT_PID 2>/dev/null; then
        echo "Force stopping backend process..."
        kill -9 $BACKEND_PORT_PID 2>/dev/null
    fi
else
    echo "No backend process found on port 8080."
fi

# Kill UI process listening on 5173
UI_PORT_PID=$(lsof -t -i :5173)
if [ -n "$UI_PORT_PID" ]; then
    echo "Stopping UI process on port 5173 (PID $UI_PORT_PID)..."
    kill -TERM $UI_PORT_PID 2>/dev/null
    sleep 1
    # Force kill if still running
    if kill -0 $UI_PORT_PID 2>/dev/null; then
        echo "Force stopping UI process..."
        kill -9 $UI_PORT_PID 2>/dev/null
    fi
else
    echo "No UI process found on port 5173."
fi

echo "Cleanup complete."
