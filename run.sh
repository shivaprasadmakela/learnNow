#!/bin/bash

# Load local environment variables. There are no credential defaults in the source
# tree any more, so .env is required rather than optional.
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
else
    echo "Error: .env not found."
    echo "Copy the template and fill it in:  cp .env.example .env"
    exit 1
fi

# The active profile is no longer defaulted in application.properties, so that a
# development profile cannot follow a build into production.
export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-local}"

for required in JWT_SECRET GOOGLE_CLIENT_ID SPRING_DATASOURCE_USERNAME SPRING_DATASOURCE_PASSWORD; do
    if [ -z "${!required}" ]; then
        echo "Error: $required is not set in .env (see .env.example)."
        exit 1
    fi
done

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    
    # Kill processes listening on the ports to avoid orphaned processes (common with maven spring-boot:run)
    BACKEND_PORT_PID=$(lsof -t -i :8080)
    if [ -n "$BACKEND_PORT_PID" ]; then
        echo "Stopping backend process on port 8080 (PID $BACKEND_PORT_PID)..."
        kill -TERM $BACKEND_PORT_PID 2>/dev/null
    fi
    
    UI_PORT_PID=$(lsof -t -i :5173)
    if [ -n "$UI_PORT_PID" ]; then
        echo "Stopping UI process on port 5173 (PID $UI_PORT_PID)..."
        kill -TERM $UI_PORT_PID 2>/dev/null
    fi

    # Also kill original spawned shell PIDs just in case
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM "$BACKEND_PID" 2>/dev/null
    fi
    
    if [ -n "$UI_PID" ]; then
        kill -TERM "$UI_PID" 2>/dev/null
    fi
    
    wait 2>/dev/null
    echo "All servers stopped."
    exit 0
}


# Trap Ctrl+C (SIGINT) and SIGTERM to trigger cleanup
trap cleanup SIGINT SIGTERM

# Check if ports 8080 or 5173 are already in use
for port in 8080 5173; do
    PID=$(lsof -t -i :$port)
    if [ -n "$PID" ]; then
        echo "Warning: Port $port is already in use by PID $PID."
        read -p "Would you like to stop the process on port $port? (y/N) " yn
        case $yn in
            [Yy]* ) 
                echo "Stopping process $PID..."
                kill -9 "$PID"
                ;;
            * ) 
                echo "Please free port $port manually or change configuration before running."
                exit 1
                ;;
        esac
    fi
done

echo "Starting Backend Server..."
cd backend
mvn spring-boot:run &
BACKEND_PID=$!
cd ..

# Wait for backend to start listening on port 8080
echo "Waiting for backend to start on port 8080..."
while ! nc -z localhost 8080 >/dev/null 2>&1; do
    sleep 0.5
done
echo "Backend is ready!"

echo "Starting UI Server..."
cd ui
npm run dev &
UI_PID=$!
cd ..

echo "--------------------------------------------------"
echo "Servers are running."
echo "Backend PID: $BACKEND_PID"
echo "UI PID: $UI_PID"
echo "Press Ctrl+C to stop both servers."
echo "--------------------------------------------------"

# Wait for both processes
wait $BACKEND_PID $UI_PID
