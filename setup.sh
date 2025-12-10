# ============================================
# setup.sh - ZAYNA Quick Setup Script
# Run this script to set up the entire system
# ============================================

set -e

echo "🎨 ZAYNA - Booking System Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "${BLUE}Checking prerequisites...${NC}"

command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting."; exit 1; }

echo "${GREEN}✓ Docker is installed${NC}"
echo "${GREEN}✓ Docker Compose is installed${NC}"
echo ""

# Setup environment file
echo "${BLUE}Setting up environment variables...${NC}"

if [ ! -f .env ]; then
    cat > .env << EOL
# Database
DB_SERVER=localhost
DB_NAME=ZaynaDB
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd

# JWT
JWT_KEY=YourSuperSecretKeyForJwtTokenGenerationMinimum32Characters!
JWT_ISSUER=https://zayna.om
JWT_AUDIENCE=https://zayna.om

# Twilio (Mock in development)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+96812345678

# SendGrid (Mock in development)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@zayna.om

# Stripe (Mock in development)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Frontend
VITE_API_URL=http://localhost:5000/api
EOL
    echo "${GREEN}✓ Created .env file${NC}"
else
    echo "${YELLOW}! .env file already exists${NC}"
fi
echo ""

# Start Docker containers
echo "${BLUE}Starting Docker containers...${NC}"
docker-compose down -v 2>/dev/null || true
docker-compose up -d

echo "${GREEN}✓ Containers started${NC}"
echo ""

# Wait for SQL Server to be ready
echo "${BLUE}Waiting for SQL Server to be ready...${NC}"
sleep 30

echo "${GREEN}✓ SQL Server is ready${NC}"
echo ""

# Initialize database
echo "${BLUE}Initializing database...${NC}"
docker exec -i zayna-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrong@Passw0rd -d master -Q "CREATE DATABASE ZaynaDB;" 2>/dev/null || echo "Database might already exist"

echo "${GREEN}✓ Database initialized${NC}"
echo ""

# Display status
echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}   ✓ ZAYNA Setup Complete!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "Services are now running:"
echo "  • Frontend:  http://localhost:3000"
echo "  • Backend:   http://localhost:5000"
echo "  • Swagger:   http://localhost:5000/swagger"
echo ""
echo "Default test accounts:"
echo "  • Admin:     +96899999999"
echo "  • Salon:     +96891111111"
echo "  • Customer:  +96893333333"
echo ""
echo "Note: In development mode, OTP codes are logged to the backend console."
echo "      Check Docker logs: docker logs zayna-backend"
echo ""
echo "To stop the services:  docker-compose down"
echo "To view logs:          docker-compose logs -f"
echo ""
echo "${BLUE}Happy coding! 🎨${NC}"
