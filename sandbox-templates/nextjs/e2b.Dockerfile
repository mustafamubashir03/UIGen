FROM node:22-slim

# Install curl
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /home/user

# Copy compile script
COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Create Next.js app
RUN npx --yes create-next-app@16.1.6 . --yes

# Initialize shadcn
RUN npx --yes shadcn@2.6.3 init --yes -b neutral --force

# Add all shadcn components
RUN npx --yes shadcn@2.6.3 add --all --yes

# Install dependencies for cn()
RUN npm install clsx tailwind-merge tw-animate-css

# Create missing utils.ts
RUN mkdir -p lib && echo "import { clsx, type ClassValue } from 'clsx'; import { twMerge } from 'tailwind-merge'; export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }" > lib/utils.ts