import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-6 text-[#0F172A]">
      <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FF6200]/30 bg-[#FF6200]/15 text-[#FF6200]">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-[#0F172A]">404 - Page Not Found</h2>
        <p className="mb-6 text-xs text-[#64748B]">
          The page you requested does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FF6200]/20 hover:opacity-95 transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
