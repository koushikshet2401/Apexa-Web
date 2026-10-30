import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#040810] text-[#F3F4F6] flex flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-6">
        <span className="font-display text-8xl md:text-9xl font-light tracking-tight text-[#38BDF8]/20 select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-xs uppercase tracking-[0.4em] text-[#7DD3FC]">
            Page Not Found
          </span>
        </div>
      </div>

      <h1 className="font-display text-2xl md:text-3xl text-white font-light tracking-wide max-w-md mb-4">
        The requested address is currently unavailable.
      </h1>

      <p className="font-sans text-sm text-[#94A3B8] max-w-sm mb-8 leading-relaxed">
        Discover exceptional properties across our international portfolio or return to the main showcase.
      </p>

      <Link
        href="/"
        className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#0E1A30] hover:bg-[#1E293B] text-white border border-[#38BDF8]/40 hover:border-[#38BDF8] text-xs font-medium uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
      >
        Return Home
      </Link>
    </main>
  );
}

