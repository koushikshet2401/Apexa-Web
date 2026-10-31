import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const updates: Record<string, string> = {
    dubai: '/videos/All Dubai Collection  (1).mp4',
    thailand: '/videos/All Thailand Collection.mp4',
    malaysia: '/videos/All Malasiya Collrction.mp4',
    georgia: '/videos/All Georgia Collection.mp4',
    australia: '/videos/luxury-palm-beach.mp4',
  }

  for (const [slug, heroVideoUrl] of Object.entries(updates)) {
    try {
      const country = await prisma.country.update({
        where: { slug },
        data: { heroVideoUrl },
      })
      console.log(`Updated ${country.name} (${slug}) heroVideoUrl -> ${heroVideoUrl}`)
    } catch (e) {
      console.warn(`Could not update ${slug}:`, e)
    }
  }

  console.log('Finished updating country videos.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
