# You can use most Debian-based base images
FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Install dependencies and customize sandbox
WORKDIR /home/user/nextjs-app

# Create a new Next.js app
RUN npx --yes create-next-app@15.5.4 . --yes

# Initialize shadcn UI
RUN npx --yes shadcn@2.6.3 init --yes -b neutral --force
RUN npx --yes shadcn@2.6.3 add --all --yes

# Create the missing utils file before moving the app
RUN mkdir -p /home/user/lib \
    && echo "export function cn(...classes: (string | boolean | undefined | null)[]) { return classes.filter(Boolean).join(' ') }" > /home/user/lib/utils.ts

# Move the Next.js app to the home directory and remove the nextjs-app directory
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app

WORKDIR /home/user