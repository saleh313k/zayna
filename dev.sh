# ============================================
# dev.sh - Development Helper Script
# ============================================

#!/bin/bash
# Quick commands for development

case "$1" in
  start)
    echo "🚀 Starting ZAYNA services..."
    docker-compose up -d
    ;;
  stop)
    echo "🛑 Stopping ZAYNA services..."
    docker-compose down
    ;;
  restart)
    echo "♻️  Restarting ZAYNA services..."
    docker-compose restart
    ;;
  logs)
    docker-compose logs -f
    ;;
  backend-logs)
    docker logs -f zayna-backend
    ;;
  frontend-logs)
    docker logs -f zayna-frontend
    ;;
  db-logs)
    docker logs -f zayna-sqlserver
    ;;
  clean)
    echo "🧹 Cleaning up..."
    docker-compose down -v
    docker system prune -f
    ;;
  backup)
    echo "💾 Creating database backup..."
    docker exec zayna-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrong@Passw0rd \
      -Q "BACKUP DATABASE ZaynaDB TO DISK = '/var/opt/mssql/backup/zayna-$(date +%Y%m%d).bak'"
    echo "✓ Backup created"
    ;;
  status)
    echo "📊 Service Status:"
    docker-compose ps
    ;;
  *)
    echo "ZAYNA Development Helper"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start         - Start all services"
    echo "  stop          - Stop all services"
    echo "  restart       - Restart all services"
    echo "  logs          - View all logs"
    echo "  backend-logs  - View backend logs"
    echo "  frontend-logs - View frontend logs"
    echo "  db-logs       - View database logs"
    echo "  clean         - Clean up containers and volumes"
    echo "  backup        - Create database backup"
    echo "  status        - Show service status"
    echo ""
    ;;
esac