# Uses the latest LTS release of NodeJS
FROM node:25.9.0@sha256:78839ac448c23517f8eab2e8f7943d9b4f73979eb7f8bed2c73dbf72ff869e7b AS builder

# Stores the project files in /app
WORKDIR /app

COPY ./package.json ./
COPY ./package-lock.json ./

# Write default environment variables
# NOTE: Should be overwridden in production use.
# Can be copied from a temporary countainer to
# create a persistent database.
ENV DATABASE_URL="file:local.db"

# Reinstalls all dependencies cleanly
RUN npm ci

# Build the project using the node adapter
COPY ./ ./
RUN npm run postinstall
RUN npm run build

# Initialize database with drizzle
RUN npm run db:push -- --force

FROM node:25.9.0@sha256:78839ac448c23517f8eab2e8f7943d9b4f73979eb7f8bed2c73dbf72ff869e7b

# Sets the production runtime user
USER node:node

# Stores the project files in /app
WORKDIR /app

# Copies production build to the image
COPY --from=builder --chown=node:node /app/build ./build/
COPY --from=builder --chown=node:node /app/local.db ./

# NOTE: All neccessary files should already have been
# installed/copied (see: `npm run postbuild:install`).

EXPOSE 3000

# Starts the node server
CMD [ "node", "./build" ]
