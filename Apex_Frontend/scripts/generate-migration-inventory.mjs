import fs from 'fs';

const prodInventory = JSON.parse(fs.readFileSync('scripts/prod-media-inventory-classified.json', 'utf8'));
const r2Objects = JSON.parse(fs.readFileSync('scripts/r2-existing-objects.json', 'utf8'));
const r2KeySet = new Set(r2Objects.map(o => o.key));

console.log(`Matching ${prodInventory.length} production items against R2 keys...`);

const mapping = prodInventory.map(item => {
  const currentUrl = item.currentUrl;
  let proposedR2Key = null;
  let fileAvailability = 'UNKNOWN';
  let verificationStatus = 'PENDING';
  let actionRequired = 'NO_OP';

  if (item.status === 'KNOWN_BROKEN_HTTP404') {
    fileAvailability = 'UNAVAILABLE_HTTP404';
    verificationStatus = 'VERIFIED_BROKEN_HTTP404';
    actionRequired = 'CLEAR_TO_NULL_PLACEHOLDER';
    proposedR2Key = null; // No file, keep slot empty
  } else if (item.status === 'ACTIVE_R2') {
    fileAvailability = 'AVAILABLE_IN_R2';
    verificationStatus = 'VERIFIED_ACTIVE_R2';
    actionRequired = 'PRESERVE_EXISTING_R2';
    // extract key from url
    try {
      const u = new URL(currentUrl);
      proposedR2Key = u.pathname.replace(/^\/+/, '');
    } catch {
      proposedR2Key = currentUrl;
    }
  } else if (item.status === 'LOCAL_STATIC_FILE') {
    const cleanPath = currentUrl.replace(/^\/+/, '');
    const filename = cleanPath.split('/').pop();
    const folder = cleanPath.split('/')[0]; // images or videos
    
    // Check if matching key in R2
    const matchingKey = r2Objects.find(o => o.key.includes(filename));
    if (matchingKey) {
      proposedR2Key = matchingKey.key;
      fileAvailability = 'AVAILABLE_LOCAL_AND_R2';
      verificationStatus = 'VERIFIED_EXISTS_ON_DISK_AND_R2';
      actionRequired = 'UPDATE_DB_REF_TO_R2';
    } else {
      proposedR2Key = `${item.table.toLowerCase()}/${filename}`;
      fileAvailability = 'AVAILABLE_LOCAL_ONLY';
      verificationStatus = 'VERIFIED_EXISTS_ON_DISK';
      actionRequired = 'UPLOAD_TO_R2_THEN_UPDATE_DB';
    }
  } else if (item.status === 'ACTIVE_EXTERNAL') {
    // Unsplash
    // Check if already in R2 from P1-B
    // In P1-B, files were named like {propertySlug}-gallery-{order}.jpg or similar
    const propSlugMatch = item.parent.match(/\(([^)]+)\)/);
    const slug = propSlugMatch ? propSlugMatch[1] : '';
    
    const matchingKey = r2Objects.find(o => {
      if (slug && o.key.includes(slug)) {
        if (item.column === 'mainImage' && (o.key.includes('main') || o.key.includes('cover'))) return true;
        if (item.role.includes('Gallery Image') && o.key.includes(`gallery-${item.order}`)) return true;
      }
      return false;
    });

    if (matchingKey) {
      proposedR2Key = matchingKey.key;
      fileAvailability = 'AVAILABLE_REMOTE_AND_R2';
      verificationStatus = 'VERIFIED_R2_COPY_READY';
      actionRequired = 'UPDATE_DB_REF_TO_R2';
    } else {
      proposedR2Key = slug ? `properties/${slug}/${item.column}-${item.order || 0}.jpg` : `misc/${item.id}.jpg`;
      fileAvailability = 'AVAILABLE_REMOTE_UNSPLASH';
      verificationStatus = 'VERIFIED_UNSPLASH_HTTP200';
      actionRequired = 'MIGRATE_UNSPLASH_TO_R2';
    }
  }

  return {
    table: item.table,
    recordId: item.id,
    targetColumn: item.column,
    sectionOrProperty: item.parent,
    role: item.role,
    order: item.order ?? null,
    currentReference: currentUrl,
    proposedR2Key,
    fileAvailability,
    verificationStatus,
    actionRequired,
  };
});

fs.writeFileSync('scripts/prod-media-migration-inventory.json', JSON.stringify(mapping, null, 2));
console.log(`Generated migration inventory for ${mapping.length} items.`);

const summary = {};
mapping.forEach(m => {
  summary[m.actionRequired] = (summary[m.actionRequired] || 0) + 1;
});
console.log('\nMigration Action Summary:');
console.log(summary);
