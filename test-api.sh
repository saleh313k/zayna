#!/usr/bin/env bash
# ============================================
# test-api.sh - API Testing Script
# ============================================

# Quick API tests

API_URL="http://localhost:5000/api"

echo "🧪 Testing ZAYNA API"
echo "==================="
echo ""

# Test health
echo "1. Testing API health..."
curl -s "$API_URL/salon" > /dev/null && echo "✓ API is responding" || echo "❌ API is not responding"
echo ""

# Test sending OTP
echo "2. Testing OTP send..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+96899999999", "purpose": "Login"}')

if echo "$RESPONSE" | grep -q "success\|sent"; then
    echo "✓ OTP send working"
else
    echo "❌ OTP send failed"
fi
echo ""

# Test getting salons
echo "3. Testing salon list..."
SALONS=$(curl -s "$API_URL/salon")
if [ ! -z "$SALONS" ]; then
    echo "✓ Salon list working"
else
    echo "❌ Salon list failed"
fi
echo ""

# Test Swagger
echo "4. Testing Swagger documentation..."
curl -s "http://localhost:5000/swagger" > /dev/null && echo "✓ Swagger available" || echo "❌ Swagger not available"
echo ""

echo "==================="
echo "✓ API Tests Complete"
echo ""
echo "Full API documentation: http://localhost:5000/swagger"

# ============================================
# deploy-prod.sh - Production Deployment Script
# ============================================

#!/bin/bash
# Production deployment script

echo "🚀 ZAYNA Production Deployment"
echo "=============================="
echo ""

# Check if on production branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    echo "❌ Not on main/master branch. Switch before deploying."
    exit 1
fi

echo "Building production images..."

# Build backend
cd Backend
dotnet publish -c Release -o ./publish
docker build -t zayna-backend:latest .
cd ..

# Build frontend
cd Frontend
npm run build
docker build -t zayna-frontend:latest .
cd ..

echo "✓ Images built"
echo ""

# Tag images
echo "Tagging images..."
docker tag zayna-backend:latest registry.zayna.om/backend:latest
docker tag zayna-frontend:latest registry.zayna.om/frontend:latest

echo "✓ Images tagged"
echo ""

# Push to registry
echo "Pushing to registry..."
docker push registry.zayna.om/backend:latest
docker push registry.zayna.om/frontend:latest

echo "✓ Images pushed"
echo ""

echo "=============================="
echo "✓ Deployment Complete!"
echo ""
echo "Next steps:"
echo "  1. SSH to production server"
echo "  2. Pull latest images"
echo "  3. Run: docker compose -f docker-compose.prod.yml up -d"
echo ""
