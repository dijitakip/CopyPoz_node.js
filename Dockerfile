FROM node:22-alpine

WORKDIR /app

# Install OpenSSL and other dependencies
RUN apk add --no-cache openssl openssl-dev

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
