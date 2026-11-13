import { PrismaClient } from '@prisma/client'

const DEFAULT_HOMEPAGE_COPY = {
  unveilLabel: 'NEW LAUNCHES',
  unveilHeading: 'Unveil the Latest in Exceptional Living',
  unveilSubtext:
    'Discover exceptional properties across our international portfolio, each selected for its location, design and long-term potential.',
  collectionEyebrow: 'SIGNATURE RESIDENCES',
  collectionHeading: 'The collection',
  collectionDescription:
    'Five addresses, each designed around its site. Drag, swipe or click to explore the portfolio.',
  spacesHeading: 'Spaces in the round',
  spacesDescription: 'Exteriors and interiors from across the portfolio. Drag the ring to turn it.',
  advisoryEyebrow: 'PRIVATE ADVISORY',
  advisoryHeading: 'Begin your conversation',
  advisoryDescription:
    'Our senior partners advise private clients and family offices on prime residential acquisitions across the Gulf, Southeast Asia, and Australasia.',
  advisoryFooterNote: 'CONFIDENTIAL · INVITATION ONLY',
  contactEyebrow: 'Private Enquiries & Advisory',
  contactHeading: 'Connect With Our Desk',
  contactDescription:
    'Please enter your requirements below. Our advisory office will review your enquiry confidentially and respond with a curated dossier.',
  contactFormHeading: 'Register Your Interest',
  contactFormSubtext:
    'Please enter your requirements below. Our advisory team will review your enquiry confidentially and respond with a curated dossier.',
  contactSuccessHeading: 'Enquiry Received',
  contactSuccessSubtext:
    'Thank you for registering your interest with Apex Pacific Holdings. Our partners will review your requirements and follow up confidentially.',
}

const DEFAULT_ONE_TEAM_COPY = {
  sectionEyebrow: 'WHAT WE DO',
  sectionHeading: 'One team, end to end',
  sectionDescription:
    'Development, design and advice from a single studio, so nothing is lost between the drawing board and the front door.',
  bannerLabel: 'APEX PACIFIC HOLDINGS',
  bannerHeading: 'One team, end to end',
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

async function main() {
  const prisma = new PrismaClient()
  try {
    const dbCheck = await prisma.$queryRawUnsafe('SELECT current_database() AS db')
    const activeDb = dbCheck?.[0]?.db
    if (activeDb !== 'apex_disposable_test' && process.env.ALLOW_TARGET_DB !== activeDb) {
      throw new Error(
        `Safety abort: connected to "${activeDb}" instead of "apex_disposable_test".`
      )
    }

    const homepage = await prisma.homepageContent.findFirst()
    let homepageUpdatedFields = []

    if (!homepage) {
      await prisma.homepageContent.create({
        data: DEFAULT_HOMEPAGE_COPY,
      })
      homepageUpdatedFields = Object.keys(DEFAULT_HOMEPAGE_COPY)
    } else {
      const hpPatch = {}
      for (const [key, fallback] of Object.entries(DEFAULT_HOMEPAGE_COPY)) {
        if (isBlank(homepage[key])) {
          hpPatch[key] = fallback
          homepageUpdatedFields.push(key)
        }
      }
      if (homepageUpdatedFields.length > 0) {
        await prisma.homepageContent.update({
          where: { id: homepage.id },
          data: hpPatch,
        })
      }
    }

    const oneTeam = await prisma.oneTeamContent.findFirst({ orderBy: { createdAt: 'asc' } })
    let oneTeamUpdatedFields = []

    if (!oneTeam) {
      await prisma.oneTeamContent.create({
        data: {
          ...DEFAULT_ONE_TEAM_COPY,
          updatedBy: 'p2-stage1-seed',
        },
      })
      oneTeamUpdatedFields = Object.keys(DEFAULT_ONE_TEAM_COPY)
    } else {
      const otPatch = {}
      for (const [key, fallback] of Object.entries(DEFAULT_ONE_TEAM_COPY)) {
        if (isBlank(oneTeam[key])) {
          otPatch[key] = fallback
          oneTeamUpdatedFields.push(key)
        }
      }
      if (oneTeamUpdatedFields.length > 0) {
        await prisma.oneTeamContent.update({
          where: { id: oneTeam.id },
          data: otPatch,
        })
      }
    }

    console.log(
      JSON.stringify(
        {
          database: activeDb,
          homepageUpdatedFieldsCount: homepageUpdatedFields.length,
          homepageUpdatedFields,
          oneTeamUpdatedFieldsCount: oneTeamUpdatedFields.length,
          oneTeamUpdatedFields,
        },
        null,
        2
      )
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
