import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/**
 * Global Prisma Client singleton with dynamic test override support.
 * In development and production, lazily instantiates PrismaClient singleton.
 * In integration test environments, dynamically delegates to test database client.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient()
    }
    const client = globalForPrisma.prisma
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

if (process.env.NODE_ENV !== 'production' && !globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient()
}
