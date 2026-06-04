import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#080810] py-8 mt-20">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-white/30">© 2026 Zorixa AI. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-end">
          <Link href="/about" className="text-sm text-white/40 hover:text-white transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-sm text-white/40 hover:text-white transition-colors">
            Contact
          </Link>
          <Link href="/billing" className="text-sm text-white/40 hover:text-white transition-colors">
            Billing
          </Link>
          <Link href="/helpsupport" className="text-sm text-white/40 hover:text-white transition-colors">
            Help
          </Link>
          <Link href="/faq" className="text-sm text-white/40 hover:text-white transition-colors">
            FAQ
          </Link>
          <Link href="/pricing" className="text-sm text-white/40 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/terms" className="text-sm text-white/40 hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-sm text-white/40 hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}

