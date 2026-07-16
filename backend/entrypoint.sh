set -e
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "PostgreSQL not ready yet — retrying in 2s..."
  sleep 2
done
echo "✅ PostgreSQL is ready."
echo "🔄 Running Prisma migrations..."

npx prisma migrate deploy
echo "✅ Migrations complete."
echo "🚀 Starting server..."

exec node src/server.js