FROM node:24-alpine AS development

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY tsconfig.build.json .
COPY nest-cli.json .

# Copy only the auth service and libs (preserve paths for nest build)
COPY ./apps/auth ./apps/auth
COPY ./libs ./libs

# Install dependencies
RUN npm install

# Build the application
RUN npm run build auth

EXPOSE 4001

CMD ["node", "dist/apps/auth/main"]