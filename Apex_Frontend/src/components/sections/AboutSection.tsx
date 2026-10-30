'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useInView, useScroll, useTransform } from 'framer-motion'
import { PhotoCard } from '@/components/ui/3d-card'

/* ─── Stat counter ──────────────────────────────────────────────────────── */
interface StatItem {
  numericValue: number
  display: string
  label: string
}

const STATS: StatItem[] = [
  { numericValue: 15, display: '15+', label: 'YEARS' },
  { numericValue: 240, display: '240', label: 'HOMES DELIVERED' },
  { numericValue: 12, display: '12', label: 'CITIES' },
  { numericValue: 98, display: '98%', label: 'REFERRAL RATE' },
]

function AnimatedStat({ stat, delay }: { stat: StatItem; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const shouldReduceMotion = useReducedMotion()
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!inView || done || shouldReduceMotion) {
      if (shouldReduceMotion) setCount(stat.numericValue)
      return
    }
    const duration = 1600
    const steps = 48
    const increment = stat.numericValue / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(step * increment, stat.numericValue)
      setCount(Math.floor(current))
      if (step >= steps) {
        clearInterval(timer)
        setCount(stat.numericValue)
        setDone(true)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, done, stat.numericValue, shouldReduceMotion])

  const suffix = stat.display.replace(/[0-9]/g, '')
  const displayCount = done ? stat.display : `${count}${suffix}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col gap-1.5"
    >
      <span
        ref={ref}
        className="font-serif font-light text-[#F8FAFC]"
        style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3rem)', lineHeight: 1 }}
      >
        {displayCount}
      </span>
      <span
        className="font-sans uppercase tracking-[0.22em] text-[#94A3B8]"
        style={{ fontSize: '0.6rem' }}
      >
        {stat.label}
      </span>
    </motion.div>
  )
}

/* ─── Main About section ────────────────────────────────────────────────── */
export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const imageWrapRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const sealParallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : isMobile ? [6, -6] : [18, -18]
  )

  useEffect(() => {
    if (shouldReduceMotion || isMobile) return
    const wrap = imageWrapRef.current
    if (!wrap) return

    let raf = 0
    let targetRotX = 0, targetRotY = 0
    let currentRotX = 0, currentRotY = 0

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      targetRotX = -ny * 5.5
      targetRotY = nx * 6.5
    }

    const onLeave = () => {
      targetRotX = 0
      targetRotY = 0
    }

    const tick = () => {
      currentRotX += (targetRotX - currentRotX) * 0.055
      currentRotY += (targetRotY - currentRotY) * 0.055

      wrap.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`
      raf = requestAnimationFrame(tick)
    }

    wrap.addEventListener('mousemove', onMove)
    wrap.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(tick)

    return () => {
      wrap.removeEventListener('mousemove', onMove)
      wrap.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [shouldReduceMotion, isMobile])

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative z-10 w-full overflow-hidden"
      style={{ backgroundColor: '#070E1C' }}
      aria-label="About Apex Pacific Holdings"
    >
      <div
        className="absolute top-0 left-0 right-0 h-28 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, #040810 0%, transparent 100%)' }}
      />

      <div className="relative z-20 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20 py-20 lg:py-28 xl:py-36">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 xl:gap-20 items-start">
          {/* ══ LEFT: LAYERED 3D IMAGE COMPOSITION ════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full"
            style={{ perspective: '1200px', perspectiveOrigin: '50% 45%' }}
          >
            <div
              ref={imageWrapRef}
              className="relative w-full transition-transform ease-out will-change-transform"
              style={{
                minHeight: isMobile ? 'clamp(380px, 86vw, 470px)' : 'clamp(490px, 45vw, 630px)',
                transformStyle: 'preserve-3d',
              }}
            >
              <PhotoCard
                src="/images/p1.jpg"
                alt="Apex luxury architectural residence exterior"
                rotation={-8}
                text="Signature Villa Architecture"
                index={0}
                className="w-[210px] h-[300px] sm:w-[260px] sm:h-[370px] lg:w-[290px] lg:h-[415px]"
                style={{
                  top: isMobile ? '8px' : '20px',
                  left: isMobile ? '0px' : '15px',
                }}
              />

              <PhotoCard
                src="/images/p5.jpg"
                alt="Apex luxury interior design"
                rotation={14}
                text="Bespoke Penthouse Interiors"
                index={1}
                className="w-[200px] h-[285px] sm:w-[250px] sm:h-[355px] lg:w-[280px] lg:h-[400px]"
                style={{
                  bottom: isMobile ? '12px' : '30px',
                  right: isMobile ? '0px' : '20px',
                }}
              />

              {/* APEX BRAND SEAL */}
              <motion.div
                className="absolute z-10 will-change-transform"
                style={{
                  left: isMobile ? 'clamp(110px, 42%, 180px)' : 'clamp(140px, 40%, 250px)',
                  top: isMobile ? 'clamp(120px, 42%, 180px)' : 'clamp(140px, 38%, 240px)',
                  transform: 'translate(-50%, -50%) translateZ(55px)',
                  y: sealParallaxY,
                }}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.75, delay: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <motion.div
                  className="flex items-center justify-center rounded-full"
                  animate={shouldReduceMotion ? {} : {
                    y: [-3, 3, -3],
                  }}
                  transition={{
                    duration: 6.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    width: isMobile ? 54 : 66,
                    height: isMobile ? 54 : 66,
                    background: 'radial-gradient(circle, #040810 55%, #0B1528 100%)',
                    border: '1px solid rgba(125,211,252,0.40)',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.65), 0 0 18px rgba(125,211,252,0.15)',
                  }}
                >
                  <svg width={isMobile ? "24" : "28"} height={isMobile ? "24" : "28"} viewBox="0 0 28 28" fill="none" aria-hidden="true">
                    <path
                      d="M 14,5 L 15.5,5 L 23,22.5 L 19.5,22.5 L 16.5,14.5 L 11.5,14.5 L 8.5,22.5 L 5,22.5 Z"
                      fill="none"
                      stroke="#7DD3FC"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 14,9.5 L 16,14 L 12,14 Z"
                      fill="none"
                      stroke="#7DD3FC"
                      strokeWidth="0.9"
                      opacity="0.85"
                    />
                  </svg>
                </motion.div>
              </motion.div>

              {/* CURATED ESTATE FLOATING LABEL */}
              <motion.div
                className="absolute left-0 z-4"
                style={{
                  bottom: isMobile ? '4px' : 'clamp(80px, 26%, 130px)',
                  transform: 'translateX(-6px) translateZ(24px)',
                }}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: -6 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, delay: 0.55 }}
              >
                <div
                  className="flex flex-col gap-0.5 px-3 py-1.5 sm:py-2"
                  style={{
                    background: 'rgba(7,14,28,0.92)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(125,211,252,0.25)',
                    borderLeft: '2px solid #38BDF8',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                  }}
                >
                  <span className="font-mono text-[#7DD3FC] uppercase tracking-[0.25em]" style={{ fontSize: '0.55rem' }}>
                    CURATED ESTATE
                  </span>
                  <span className="font-serif text-[#F8FAFC] font-light" style={{ fontSize: '0.82rem', letterSpacing: '0.04em' }}>
                    Exceptional Living
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* ══ RIGHT: TEXT CONTENT ═══════════════════════════════════════════ */}
          <div className="flex flex-col justify-center lg:pt-4">
            {/* Eyebrow */}
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <span className="w-8 h-px bg-sky-400/60" />
              <span
                className="font-mono uppercase tracking-[0.28em] text-[#7DD3FC]"
                style={{ fontSize: '0.65rem' }}
              >
                ABOUT APEX
              </span>
            </motion.div>

            {/* Main heading */}
            <div className="overflow-hidden mb-6">
              <motion.h2
                className="font-serif font-light text-[#F8FAFC] text-balance"
                style={{ fontSize: 'clamp(2.2rem,3.8vw,3.6rem)', lineHeight: 1.08, letterSpacing: '-0.02em' }}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.75, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
              >
                A legacy in every{' '}
                <em className="italic text-sky-200" style={{ fontStyle: 'italic' }}>address</em>
              </motion.h2>
            </div>

            {/* Main statement */}
            <motion.p
              className="font-sans font-light leading-[1.78] text-pretty mb-4"
              style={{ fontSize: 'clamp(0.92rem,1.15vw,1.05rem)', color: '#CBD5E1', maxWidth: '48ch' }}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            >
              We create residences for those who discern the details: the way morning light sweeps across
              honed travertine, the quiet acoustic stillness of architectural volumes, and the enduring harmony of native landscape.
            </motion.p>

            {/* Supporting paragraph */}
            <motion.p
              className="font-sans font-light leading-[1.72] text-pretty mb-10"
              style={{ fontSize: 'clamp(0.82rem,1vw,0.9rem)', color: '#94A3B8', maxWidth: '46ch' }}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, delay: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Apex Pacific Holdings develops and curates landmark luxury residences for discerning families and global investors across the UAE, Thailand, Malaysia, Australia, and Georgia. From initial site acquisition to handing over the keys, our integrated practice carries each project through architectural conception, precision engineering, and bespoke finishing.
            </motion.p>

            {/* Statistics row */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <div className="w-full h-px mb-7" style={{ background: 'rgba(203,213,225,0.12)' }} />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0">
                {STATS.map((stat, i) => (
                  <div key={stat.label} className="relative flex flex-col">
                    {i > 0 && (
                      <div
                        className="hidden sm:block absolute left-0 top-0 bottom-0 w-px"
                        style={{ background: 'rgba(203,213,225,0.12)' }}
                      />
                    )}
                    <div className={i > 0 ? 'sm:pl-6' : ''}>
                      <AnimatedStat stat={stat} delay={0.38 + i * 0.06} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full h-px mt-7" style={{ background: 'rgba(203,213,225,0.12)' }} />
            </motion.div>

            {/* Leadership Practice Note */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div
                className="shrink-0 flex items-center justify-center rounded-full bg-sky-400/10 border border-sky-400/30"
                style={{ width: 40, height: 40 }}
              >
                <span className="font-serif text-[#7DD3FC] font-light" style={{ fontSize: '0.9rem' }}>A</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span
                  className="font-serif italic text-white font-light"
                  style={{ fontSize: 'clamp(0.9rem,1.2vw,1.05rem)', letterSpacing: '0.01em' }}
                >
                  Apex Pacific Holdings
                </span>
                <span
                  className="font-mono uppercase tracking-[0.22em] text-[#94A3B8]"
                  style={{ fontSize: '0.58rem' }}
                >
                  GLOBAL ARCHITECTURAL PRACTICE
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
