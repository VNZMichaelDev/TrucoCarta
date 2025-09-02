#!/bin/bash

# Docker setup script for Truco Online MVP

echo "🃏 Setting up Truco Online MVP with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment files if they don't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOL
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
EOL
fi

if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env file..."
    cat > backend/.env << EOL
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
EOL
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.dev.yml build

echo "🚀 Starting services..."
docker-compose -f docker-compose.dev.yml up -d

echo "✅ Truco Online MVP is now running!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "To stop the services, run: docker-compose -f docker-compose.dev.yml down"
echo "To view logs, run: docker-compose -f docker-compose.dev.yml logs -f"
