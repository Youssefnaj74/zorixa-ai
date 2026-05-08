import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#080810] py-8 mt-20">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-white/30">© 2026 Zorixa AI. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm text-white/40 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/terms" className="text-sm text-white/40 hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-sm text-white/40 hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <a
            href="mailto:support@zorixaai.com"
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}

