import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const existing = await prisma.homepageContent.findFirst()
  if (existing) {
    await prisma.homepageContent.update({
      where: { id: existing.id },
      data: { heroVideoUrl: '/videos/Home Page.mp4' }
    })
    console.log('Updated heroVideoUrl')
  } else {
    await prisma.homepageContent.create({
      data: { heroVideoUrl: '/videos/Home Page.mp4' }
    })
    console.log('Created HomepageContent with heroVideoUrl')
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
