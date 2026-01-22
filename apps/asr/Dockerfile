FROM node:24-alpine AS builder

WORKDIR /app

# update npm
RUN npm install -g npm@11.7.0

# copy package.json, package-lock.json tsconfig.json, tsconfig.build.json, and nest-cli.json files
COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./


# copy only needed folders and libs
COPY ./apps/asr /app/apps/asr
COPY ./libs /app/libs

# install all deps including dev and build
RUN npm ci
RUN npm run build asr

########################################################

FROM node:24-alpine AS runtime

WORKDIR /app

# create tmp folder for ASR uploads
#RUN mkdir -p /app/tmp/asr_uploads

# copy package.json and package-lock.json files only for runtime
COPY package.json package-lock.json ./

# install only production deps for smaller image
RUN npm ci --only=production

# copy built output
COPY --from=builder /app/dist/apps/asr /app/asr
