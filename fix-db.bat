@echo off
echo Fixing Prisma Client and Database...
cd server
call npx prisma generate
call npx prisma db push --accept-data-loss
echo Done! Please restart your server if it doesn't restart automatically.
pause
