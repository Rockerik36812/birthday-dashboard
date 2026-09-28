# Dockerfile para Birthday Dashboard
# Multi-stage build para producción optimizada

# ===== STAGE 1: Base =====
FROM node:20-alpine AS base

# Instalar dependencias del sistema necesarias para Prisma, Sharp y su-exec
RUN apk add --no-cache libc6-compat openssl su-exec

WORKDIR /app

# ===== STAGE 2: Dependencies =====
FROM base AS deps

# Copiar archivos de package
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# ===== STAGE 3: Builder =====
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy config files first for path resolution
COPY tsconfig.json next.config.js postcss.config.js tailwind.config.ts ./
COPY . .

# Variables de build
ENV NEXT_TELEMETRY_DISABLED=1

# Build de la aplicación
RUN npm run build

# ===== STAGE 4: Runner =====
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios — Sin standalone para evitar prerender issues en Next.js 14
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Entrypoint para inicializar BD (corre como root para chown, luego su-exec a nextjs)
COPY --chown=nextjs:nodejs entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Volumen para base de datos SQLite
VOLUME ["/app/data"]

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "/app/entrypoint.sh"]