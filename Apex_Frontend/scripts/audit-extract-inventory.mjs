import { PrismaClient } from '@prisma/client';
import fs from 'fs';

async function extractCompleteMediaInventory() {
  const prisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:ehasan2026@localhost:5432/apex?schema=public' } }
  });

  const inventory = [];

  try {
    // 1. PropertyImages
    const propImages = await prisma.$queryRawUnsafe(`
      SELECT pi.id, pi."propertyId", p.name as property_name, p.slug as property_slug,
             pi.url, pi.alt, pi."order", pi.description
      FROM "PropertyImage" pi
      JOIN "Property" p ON p.id = pi."propertyId"
      ORDER BY p.name, pi."order" ASC;
    `);

    propImages.forEach(img => {
      inventory.push({
        table: 'PropertyImage',
        id: img.id,
        parent: `${img.property_name} (${img.property_slug})`,
        role: `Gallery Image #${img.order}`,
        order: img.order,
        column: 'url',
        currentUrl: img.url,
      });
    });

    // 2. Property main fields
    const properties = await prisma.$queryRawUnsafe(`
      SELECT id, name, slug, "mainImage", "mainVideoUrl", "mainVideoThumb", "spaceRoundImage"
      FROM "Property"
      ORDER BY name;
    `);

    properties.forEach(p => {
      if (p.mainImage) {
        inventory.push({
          table: 'Property',
          id: p.id,
          parent: `${p.name} (${p.slug})`,
          role: 'Property Main Image',
          column: 'mainImage',
          currentUrl: p.mainImage,
        });
      }
      if (p.mainVideoUrl) {
        inventory.push({
          table: 'Property',
          id: p.id,
          parent: `${p.name} (${p.slug})`,
          role: 'Property Main Video',
          column: 'mainVideoUrl',
          currentUrl: p.mainVideoUrl,
        });
      }
      if (p.mainVideoThumb) {
        inventory.push({
          table: 'Property',
          id: p.id,
          parent: `${p.name} (${p.slug})`,
          role: 'Property Main Video Thumb',
          column: 'mainVideoThumb',
          currentUrl: p.mainVideoThumb,
        });
      }
      if (p.spaceRoundImage) {
        inventory.push({
          table: 'Property',
          id: p.id,
          parent: `${p.name} (${p.slug})`,
          role: 'Space in the Round Image',
          column: 'spaceRoundImage',
          currentUrl: p.spaceRoundImage,
        });
      }
    });

    // 3. Country
    const countries = await prisma.$queryRawUnsafe(`
      SELECT id, name, slug, "heroVideoUrl", "heroVideoThumb", "cardImage"
      FROM "Country"
      ORDER BY name;
    `);

    countries.forEach(c => {
      if (c.heroVideoUrl) {
        inventory.push({
          table: 'Country',
          id: c.id,
          parent: `Country: ${c.name} (${c.slug})`,
          role: 'Country Hero Video',
          column: 'heroVideoUrl',
          currentUrl: c.heroVideoUrl,
        });
      }
      if (c.heroVideoThumb) {
        inventory.push({
          table: 'Country',
          id: c.id,
          parent: `Country: ${c.name} (${c.slug})`,
          role: 'Country Hero Video Thumb',
          column: 'heroVideoThumb',
          currentUrl: c.heroVideoThumb,
        });
      }
      if (c.cardImage) {
        inventory.push({
          table: 'Country',
          id: c.id,
          parent: `Country: ${c.name} (${c.slug})`,
          role: 'Country Card Image',
          column: 'cardImage',
          currentUrl: c.cardImage,
        });
      }
    });

    // 4. CollectionMedia
    const collMedia = await prisma.$queryRawUnsafe(`
      SELECT cm.id, cm."countryId", c.name as country_name, c.slug as country_slug,
             cm."coverImageUrl", cm."heroVideoUrl"
      FROM "CollectionMedia" cm
      JOIN "Country" c ON c.id = cm."countryId"
      ORDER BY c.name;
    `);

    collMedia.forEach(cm => {
      if (cm.coverImageUrl) {
        inventory.push({
          table: 'CollectionMedia',
          id: cm.id,
          parent: `Collection: ${cm.country_name} (${cm.country_slug})`,
          role: 'Collection Cover Image',
          column: 'coverImageUrl',
          currentUrl: cm.coverImageUrl,
        });
      }
      if (cm.heroVideoUrl) {
        inventory.push({
          table: 'CollectionMedia',
          id: cm.id,
          parent: `Collection: ${cm.country_name} (${cm.country_slug})`,
          role: 'Collection Hero Video',
          column: 'heroVideoUrl',
          currentUrl: cm.heroVideoUrl,
        });
      }
    });

    // 5. HomepageContent
    const hp = await prisma.$queryRawUnsafe(`
      SELECT id, "heroVideoUrl", "heroVideoThumb", "oneTeamVideoUrl", "advisoryVideoUrl"
      FROM "HomepageContent";
    `);
    if (hp.length > 0) {
      const h = hp[0];
      if (h.heroVideoUrl) inventory.push({ table: 'HomepageContent', id: h.id, parent: 'Homepage', role: 'Hero Video', column: 'heroVideoUrl', currentUrl: h.heroVideoUrl });
      if (h.heroVideoThumb) inventory.push({ table: 'HomepageContent', id: h.id, parent: 'Homepage', role: 'Hero Video Thumb', column: 'heroVideoThumb', currentUrl: h.heroVideoThumb });
      if (h.oneTeamVideoUrl) inventory.push({ table: 'HomepageContent', id: h.id, parent: 'Homepage', role: 'One Team Video', column: 'oneTeamVideoUrl', currentUrl: h.oneTeamVideoUrl });
      if (h.advisoryVideoUrl) inventory.push({ table: 'HomepageContent', id: h.id, parent: 'Homepage', role: 'Advisory Video', column: 'advisoryVideoUrl', currentUrl: h.advisoryVideoUrl });
    }

    // 6. OneTeamContent
    const ot = await prisma.$queryRawUnsafe(`
      SELECT id, "luxuryVillasImageUrl", "commercialImageUrl", "centerVideoUrl", "skyResidencesImageUrl", "waterfrontImageUrl"
      FROM "OneTeamContent";
    `);
    if (ot.length > 0) {
      const o = ot[0];
      if (o.luxuryVillasImageUrl) inventory.push({ table: 'OneTeamContent', id: o.id, parent: 'One Team', role: 'Luxury Villas Card Image', column: 'luxuryVillasImageUrl', currentUrl: o.luxuryVillasImageUrl });
      if (o.commercialImageUrl) inventory.push({ table: 'OneTeamContent', id: o.id, parent: 'One Team', role: 'Commercial Card Image', column: 'commercialImageUrl', currentUrl: o.commercialImageUrl });
      if (o.centerVideoUrl) inventory.push({ table: 'OneTeamContent', id: o.id, parent: 'One Team', role: 'Center Video', column: 'centerVideoUrl', currentUrl: o.centerVideoUrl });
      if (o.skyResidencesImageUrl) inventory.push({ table: 'OneTeamContent', id: o.id, parent: 'One Team', role: 'Sky Residences Card Image', column: 'skyResidencesImageUrl', currentUrl: o.skyResidencesImageUrl });
      if (o.waterfrontImageUrl) inventory.push({ table: 'OneTeamContent', id: o.id, parent: 'One Team', role: 'Waterfront Card Image', column: 'waterfrontImageUrl', currentUrl: o.waterfrontImageUrl });
    }

    // 7. ServiceCategory
    const services = await prisma.$queryRawUnsafe(`
      SELECT id, name, slug, image, "videoUrl"
      FROM "ServiceCategory"
      ORDER BY name;
    `);

    services.forEach(s => {
      if (s.image) inventory.push({ table: 'ServiceCategory', id: s.id, parent: `Service: ${s.name} (${s.slug})`, role: 'Service Image', column: 'image', currentUrl: s.image });
      if (s.videoUrl) inventory.push({ table: 'ServiceCategory', id: s.id, parent: `Service: ${s.name} (${s.slug})`, role: 'Service Video', column: 'videoUrl', currentUrl: s.videoUrl });
    });

    console.log(`Extracted total media items: ${inventory.length}`);

    // Classify
    let unsplashCount = 0;
    let r2Count = 0;
    let localCount = 0;
    let brokenCount = 0;
    let otherCount = 0;

    const brokenUrls = [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c', // Aurelia Villa 01
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c', // Marble Sanctuary 03
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b', // Verdant House 03
    ];

    inventory.forEach(item => {
      const u = item.currentUrl;
      const isKnownBroken = brokenUrls.some(b => u && u.includes(b));
      if (isKnownBroken) {
        item.status = 'KNOWN_BROKEN_HTTP404';
        item.type = 'BROKEN_UNSPLASH';
        brokenCount++;
      } else if (u && u.includes('unsplash.com')) {
        item.status = 'ACTIVE_EXTERNAL';
        item.type = 'UNSPLASH';
        unsplashCount++;
      } else if (u && (u.includes('.r2.dev') || u.includes('r2.cloudflarestorage.com'))) {
        item.status = 'ACTIVE_R2';
        item.type = 'R2';
        r2Count++;
      } else if (u && (u.startsWith('/') || u.startsWith('./'))) {
        item.status = 'LOCAL_STATIC_FILE';
        item.type = 'LOCAL';
        localCount++;
      } else {
        item.status = 'OTHER';
        item.type = 'OTHER';
        otherCount++;
      }
    });

    console.log('\n--- BREAKDOWN ---');
    console.log(`Unsplash (valid): ${unsplashCount}`);
    console.log(`Unsplash (known broken): ${brokenCount}`);
    console.log(`R2 (already migrated): ${r2Count}`);
    console.log(`Local Static (/images, /videos): ${localCount}`);
    console.log(`Other: ${otherCount}`);
    console.log(`TOTAL: ${inventory.length}`);

    fs.writeFileSync('scripts/prod-media-inventory-classified.json', JSON.stringify(inventory, null, 2));
    console.log('Saved to scripts/prod-media-inventory-classified.json');

  } catch (err) {
    console.error('Error in inventory extraction:', err);
  } finally {
    await prisma.$disconnect();
  }
}

extractCompleteMediaInventory();
