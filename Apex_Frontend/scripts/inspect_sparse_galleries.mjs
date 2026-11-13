import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex_disposable_test?schema=public' } }
});

async function main() {
  const slugs = ['aurelia-villa', 'marble-sanctuary', 'verdant-house'];
  for (const slug of slugs) {
    const p = await prisma.property.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: 'asc' } }
      }
    });
    if (!p) {
      console.log(`Property not found: ${slug}`);
      continue;
    }
    console.log(`\n=== [${slug}] ${p.name} ===`);
    console.log(`Total images in DB: ${p.images.length}`);
    p.images.forEach((img) => {
      console.log(`  order ${img.order}: ${img.url.slice(0, 60)} (${img.alt || 'no alt'})`);
    });
    const orders = p.images.map(i => i.order);
    console.log(`Present orders: [${orders.join(', ')}]`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
