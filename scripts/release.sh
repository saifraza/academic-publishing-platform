#!/bin/sh
# Release step: apply migrations, then seed only if the database is empty.
#
# Kept as a script rather than an inline command because Railway's
# preDeployCommand is not evaluated by a shell, so `&&` in it is passed through
# as arguments instead of chaining.
set -e

MIGRATOR=/migrator

echo "--> Applying migrations"
node "$MIGRATOR/node_modules/prisma/build/index.js" migrate deploy \
  --schema="$MIGRATOR/prisma/schema.prisma"

echo "--> Seeding (skipped automatically if data already exists)"
node "$MIGRATOR/node_modules/tsx/dist/cli.mjs" "$MIGRATOR/prisma/seed.ts"

echo "--> Release complete"
