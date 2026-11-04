ZAYNA - production readiness (this stage only)
==============================================
1. Copy 'backend', 'frontend', 'deploy', 'docs', '.github' and the root files from this zip over your repository.
2. DELETE these by hand (a zip cannot delete):
     backend/build.log                   (a committed build log)
     backend/ZAYNA.API/Dockerfile        (an empty file)
     docs/deployment_setup_guide.md      (broken: contains merge-conflict markers; kept as docs/archive/...OLD...md)
3. Windows: before committing run   git update-index --chmod=+x deploy/scripts/*.sh   (so the scripts stay executable)
   Make sure .env files are NOT committed (.gitignore now ignores them).
4. Backend changed (Program.cs, DbInitializer.cs, new Health/ class, appsettings.Production.json):
   run   dotnet build backend\ZAYNA.sln   and send me any errors. No new migration and no new packages in this stage.
5. Read docs/DEPLOYMENT.md - it is the runbook.

NEW / MOVED (17):
  .env.production.example
  .gitattributes
  .github/workflows/ci.yml
  backend/.dockerignore
  backend/ZAYNA.API/Health/DatabaseHealthCheck.cs
  backend/ZAYNA.API/appsettings.Production.json
  deploy/Caddyfile
  deploy/scripts/backup.sh
  deploy/scripts/deploy.sh
  deploy/scripts/init-db.sh
  deploy/scripts/restore.sh
  deploy/sql/init-db.sql
  deploy/web.Dockerfile
  docker-compose.prod.yml
  docs/DEPLOYMENT.md
  docs/archive/deployment_setup_guide.OLD-with-merge-conflict.md
  frontend/.dockerignore

MODIFIED (5):
  .gitignore
  backend/Dockerfile
  backend/ZAYNA.API/Program.cs
  backend/ZAYNA.Infrastructure/Data/DbInitializer.cs
  docker-compose.yml
