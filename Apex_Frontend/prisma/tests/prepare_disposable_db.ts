import { execSync } from 'child_process'
import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  REQUIRED_TEST_DB_NAME,
  MAINTENANCE_DB_NAME,
  validateTestDatabaseUrl,
  safeProvisionDisposableDb,
  buildPrismaMigrationEnv,
  verifyCurrentDatabase,
} from './run_disposable_test_db'
import { ensureDefaultRolesAndPermissions } from '../../src/lib/rbac'

export async function prepareDisposableDb(): Promise<{ testDbUrl: string }> {
  const maintenanceDbUrl = 'postgresql://postgres:ehasan2026@localhost:5432/postgres'
  const testDbUrl = `postgresql://postgres:ehasan2026@localhost:5432/${REQUIRED_TEST_DB_NAME}`

  const config = validateTestDatabaseUrl(testDbUrl)

  // 1. Clean up stale disposable DB if it exists
  const maintPrisma = new PrismaClient({
    datasources: { db: { url: config.maintenanceDbUrl } },
  })

  try {
    const existsRaw = await maintPrisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${REQUIRED_TEST_DB_NAME}) as "exists";
    `
    if (existsRaw[0]?.exists) {
      console.log(`[PREPARE] Cleaning up existing "${REQUIRED_TEST_DB_NAME}"...`)
      await maintPrisma.$executeRawUnsafe(`
        SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
        WHERE datname = '${REQUIRED_TEST_DB_NAME}' AND pid <> pg_backend_pid();
      `)
      await maintPrisma.$executeRawUnsafe(`DROP DATABASE "${REQUIRED_TEST_DB_NAME}";`)
    }
  } finally {
    await maintPrisma.$disconnect()
  }

  // 2. Safe provision
  await safeProvisionDisposableDb(config)

  // 3. Deploy all migrations
  console.log('[PREPARE] Deploying migrations to disposable test database...')
  const migrationEnv = buildPrismaMigrationEnv(config.testDbUrl)
  execSync('npx prisma migrate deploy', {
    env: migrationEnv,
    stdio: 'inherit',
  })

  // 4. Seed baseline roles, permissions, admin users, countries, properties
  console.log('[PREPARE] Seeding baseline test data...')
  const testPrisma = new PrismaClient({
    datasources: { db: { url: config.testDbUrl } },
  })

  try {
    await verifyCurrentDatabase(testPrisma, REQUIRED_TEST_DB_NAME)
    await ensureDefaultRolesAndPermissions(testPrisma)

    const passwordHash = await bcrypt.hash('TestPassword123!', 10)

    // Roles
    const superAdminRole = await testPrisma.adminRole.findUnique({ where: { name: 'SUPER_ADMIN' } })
    const propertyManagerRole = await testPrisma.adminRole.findUnique({ where: { name: 'PROPERTY_MANAGER' } })
    const contentEditorRole = await testPrisma.adminRole.findUnique({ where: { name: 'CONTENT_EDITOR' } })
    const enquiryAdvisorRole = await testPrisma.adminRole.findUnique({ where: { name: 'ENQUIRY_ADVISOR' } })
    const complianceRole = await testPrisma.adminRole.findUnique({ where: { name: 'COMPLIANCE_OFFICER' } })

    // Create Test Users
    await testPrisma.adminUser.createMany({
      data: [
        {
          email: 'superadmin@apexpacificholdings.com',
          name: 'Super Admin',
          passwordHash,
          roleId: superAdminRole!.id,
          isActive: true,
        },
        {
          email: 'manager@apexpacificholdings.com',
          name: 'Property Manager',
          passwordHash,
          roleId: propertyManagerRole!.id,
          isActive: true,
        },
        {
          email: 'editor@apexpacificholdings.com',
          name: 'Content Editor',
          passwordHash,
          roleId: contentEditorRole!.id,
          isActive: true,
        },
        {
          email: 'advisor@apexpacificholdings.com',
          name: 'Enquiry Advisor',
          passwordHash,
          roleId: enquiryAdvisorRole!.id,
          isActive: true,
        },
        {
          email: 'compliance@apexpacificholdings.com',
          name: 'Compliance Officer',
          passwordHash,
          roleId: complianceRole!.id,
          isActive: true,
        },
        {
          email: 'inactive@apexpacificholdings.com',
          name: 'Inactive Staff',
          passwordHash,
          roleId: contentEditorRole!.id,
          isActive: false,
        },
      ],
    })

    // Countries
    const uae = await testPrisma.country.create({
      data: {
        name: 'United Arab Emirates',
        displayName: 'Dubai / UAE',
        slug: 'dubai',
        region: 'Middle East',
        cities: 'Dubai, Abu Dhabi',
        tagline: 'Waterfront Villas & Sky Residences',
        description: 'Private architecture and luxury residences across Dubai.',
        heroVideoUrl: '/videos/VID02.mp4',
        cardImage: '/images/DuabiCoolection.png',
        isPublished: true,
        displayOrder: 1,
      },
    })

    const thailand = await testPrisma.country.create({
      data: {
        name: 'Thailand',
        displayName: 'Thailand',
        slug: 'thailand',
        region: 'Southeast Asia',
        cities: 'Phuket, Koh Samui, Bangkok',
        tagline: 'Tropical Sanctuaries & Coastal Estates',
        description: 'Private luxury coastal estates and hillside retreats.',
        heroVideoUrl: '/videos/luxury-palm-beach.mp4',
        cardImage: '/images/Thailand.png',
        isPublished: true,
        displayOrder: 2,
      },
    })

    // Service Categories
    const skyRes = await testPrisma.serviceCategory.create({
      data: {
        name: 'Sky Residences',
        slug: 'sky-residence',
        description: 'Ultra-luxury penthouse and high-altitude architectural residences.',
        displayOrder: 1,
      },
    })

    const luxVillas = await testPrisma.serviceCategory.create({
      data: {
        name: 'Luxury Villas',
        slug: 'luxury-villa',
        description: 'Private estates and waterfront sanctuaries.',
        displayOrder: 2,
      },
    })

    // Published Project 1: The Meridian Penthouse (Priced, Launch, Space in Round)
    const meridian = await testPrisma.property.create({
      data: {
        name: 'The Meridian Penthouse',
        slug: 'the-meridian-penthouse',
        countryId: uae.id,
        cityName: 'Dubai',
        locationLine: 'Downtown Dubai, UAE',
        type: 'residential',
        beds: '4–5 Bedrooms',
        baths: '5 Baths',
        area: '8,200 sq ft',
        price: 'AED 8,500,000.00',
        askingPriceNumeric: new Prisma.Decimal('8500000.00'),
        askingCurrency: 'AED',
        isPOA: false,
        tagline: 'Where Skyline Meets Waterfront Sanctuary',
        shortDescription: 'Ultra-prime architectural penthouse overlooking the Dubai Opera and Burj Khalifa.',
        description: 'Crafted with meticulous attention to natural light, indoor-outdoor fluidity, and bespoke artisan finishes.',
        highlights: ['Private rooftop infinity pool', 'Full Burj Khalifa skyline panoramas', 'Dedicated 24/7 concierge & valet'],
        mainImage: '/images/properties/the-meridian.jpg',
        mainVideoUrl: '/videos/luxury-palm-beach.mp4',
        spaceRoundImage: '/images/properties/the-meridian.jpg',
        isPublished: true,
        isPubliclyVisible: true,
        isDraft: false,
        isFeaturedLaunch: true,
        launchOrder: 1,
        launchDate: new Date('2026-10-15'),
        isSpaceInRound: true,
        spaceOrder: 1,
        layoutVariant: 1,
        services: {
          create: [{ serviceId: skyRes.id }],
        },
      },
    })

    // Published Project 2: The Peninsula Reserve (Priced Thailand)
    const peninsula = await testPrisma.property.create({
      data: {
        name: 'The Peninsula Reserve',
        slug: 'the-peninsula-reserve',
        countryId: thailand.id,
        cityName: 'Phuket',
        locationLine: 'Millionaires Mile, Kamala, Phuket',
        type: 'residential',
        beds: '6 Bedrooms',
        baths: '7 Baths',
        area: '14,000 sq ft',
        price: 'THB 120,000,000.00',
        askingPriceNumeric: new Prisma.Decimal('120000000.00'),
        askingCurrency: 'THB',
        isPOA: false,
        tagline: 'Private Cliffside Oceanfront Haven',
        shortDescription: 'Dramatic cantilevered oceanfront residence perched above the Andaman Sea.',
        description: 'Seamless indoor-outdoor living with cascading infinity pools and private beach access.',
        highlights: ['Private beach cove', 'Direct sunset ocean views', 'Helipad and private yacht tender mooring'],
        mainImage: '/images/properties/peninsula-reserve.jpg',
        mainVideoUrl: '/videos/VID02.mp4',
        isPublished: true,
        isPubliclyVisible: true,
        isDraft: false,
        isFeaturedLaunch: true,
        launchOrder: 2,
        launchDate: new Date('2026-10-20'),
        isSpaceInRound: true,
        spaceOrder: 2,
        layoutVariant: 2,
        services: {
          create: [{ serviceId: luxVillas.id }],
        },
      },
    })

    // Completed Deal Project: Palm Royal Showcase (Option A - Visible Acquired)
    const palmRoyal = await testPrisma.property.create({
      data: {
        name: 'Palm Royal Showcase',
        slug: 'palm-royal-showcase',
        countryId: uae.id,
        cityName: 'Dubai',
        locationLine: 'Palm Jumeirah Frond N, Dubai',
        type: 'residential',
        beds: '6 Bedrooms',
        baths: '7 Baths',
        area: '12,500 sq ft',
        price: 'Acquired',
        askingPriceNumeric: new Prisma.Decimal('28000000.00'),
        askingCurrency: 'AED',
        isPOA: false,
        isPublished: true,
        isPubliclyVisible: true,
        isDraft: false,
        hasCompletedDeal: true,
        services: {
          create: [{ serviceId: luxVillas.id }],
        },
      },
    })

    const superAdmin = await testPrisma.adminUser.findUnique({
      where: { email: 'superadmin@apexpacificholdings.com' },
    })

    // Create completed deal for Palm Royal (Option A)
    await testPrisma.deal.create({
      data: {
        dealRef: 'DEAL-SHOWCASE-OPT-A',
        propertyId: palmRoyal.id,
        buyerName: 'Private Sovereign Fund',
        status: 'COMPLETED',
        actualSalePrice: new Prisma.Decimal('27500000.00'),
        saleCurrency: 'AED',
        keepPubliclyVisible: true,
        closedAt: new Date('2026-10-25'),
        closedById: superAdmin!.id,
        notes: 'Option A trophy showcase acquisition completed.',
      },
    })

    // Completed Deal Project: Secret Waterfront Villa (Option B - Hidden Sold)
    const secretVilla = await testPrisma.property.create({
      data: {
        name: 'Secret Waterfront Villa',
        slug: 'secret-waterfront-villa',
        countryId: uae.id,
        cityName: 'Dubai',
        type: 'residential',
        price: 'Sold',
        askingPriceNumeric: new Prisma.Decimal('35000000.00'),
        askingCurrency: 'AED',
        isPOA: false,
        isPublished: true,
        isPubliclyVisible: false, // Hidden per Option B
        isDraft: false,
        hasCompletedDeal: true,
      },
    })

    await testPrisma.deal.create({
      data: {
        dealRef: 'DEAL-SECRET-OPT-B',
        propertyId: secretVilla.id,
        buyerName: 'Ultra High Net Worth Principal',
        status: 'COMPLETED',
        actualSalePrice: new Prisma.Decimal('34000000.00'),
        saleCurrency: 'AED',
        keepPubliclyVisible: false,
        closedAt: new Date('2026-10-28'),
        closedById: superAdmin!.id,
        notes: 'Option B strictly unlisted confidential transaction.',
      },
    })

    // Draft Project: Off-Plan Marina Concept (Draft)
    await testPrisma.property.create({
      data: {
        name: 'Off-Plan Marina Concept',
        slug: 'off-plan-marina-concept',
        countryId: uae.id,
        cityName: 'Dubai',
        type: 'residential',
        isPOA: false,
        isPublished: false,
        isPubliclyVisible: false,
        isDraft: true,
      },
    })

    // Archived Project: Delisted Historical Residence
    await testPrisma.property.create({
      data: {
        name: 'Delisted Historical Residence',
        slug: 'delisted-historical-residence',
        countryId: uae.id,
        cityName: 'Dubai',
        type: 'residential',
        isPOA: false,
        isPublished: false,
        isPubliclyVisible: false,
        isDraft: false,
        isArchived: true,
        archivedAt: new Date('2026-10-01'),
        archivedReason: 'Owner requested removal from active portfolio',
        archivedById: superAdmin!.id,
      },
    })

    // Seed Enquiries
    await testPrisma.enquiry.createMany({
      data: [
        {
          enquiryRef: 'APX-20261030-NEW01',
          name: 'Countess Eleanor Vance',
          email: 'e.vance@vanceholdings.ch',
          phone: '+41227181111',
          country: 'Switzerland',
          serviceInterest: 'Sky Residences',
          message: 'Interested in private consultation regarding The Meridian Penthouse.',
          propertyId: meridian.id,
          status: 'NEW',
          isRead: false,
          submittedAt: new Date('2026-11-01T10:00:00Z'),
        },
        {
          enquiryRef: 'APX-20261028-READ02',
          name: 'Sir Arthur Wellesley',
          email: 'a.wellesley@londoncapital.co.uk',
          phone: '+442079460000',
          country: 'United Kingdom',
          serviceInterest: 'Luxury Villas',
          message: 'Requesting confidential prospectus for Phuket oceanfront residences.',
          propertyId: peninsula.id,
          status: 'READ',
          isRead: true,
          readAt: new Date('2026-11-02T12:00:00Z'),
          submittedAt: new Date('2026-10-28T09:00:00Z'),
        },
        {
          enquiryRef: 'APX-20261025-PROG03',
          name: 'Tariq Al-Mansoor',
          email: 'tariq@gulfinvest.ae',
          phone: '+971501234567',
          country: 'UAE',
          serviceInterest: 'Sky Residences',
          message: 'Arranging viewing appointment for executive suite.',
          status: 'IN_PROGRESS',
          isRead: true,
          assignedAdminId: superAdmin!.id,
          submittedAt: new Date('2026-10-25T14:30:00Z'),
        },
      ],
    })

    // Seed Homepage Content
    await testPrisma.homepageContent.create({
      data: {
        heroVideoUrl: '/videos/luxury-palm-beach.mp4',
        unveilHeading: 'ARCHITECTURE OF DISTINCTION',
        unveilSubtext: 'Curating the world’s most extraordinary private residences and landmark estates.',
      },
    })

    console.log('[PREPARE OK] Baseline disposable test database ready.')
  } finally {
    await testPrisma.$disconnect()
  }

  return { testDbUrl }
}

if (require.main === module) {
  prepareDisposableDb().catch((err) => {
    console.error('Failed to prepare disposable test database:', err)
    process.exit(1)
  })
}
