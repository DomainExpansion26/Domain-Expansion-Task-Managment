import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0D0D] p-6 text-[#F3F4F6]">
      <div className="w-full max-w-md rounded-3xl border border-[#2E2E2E] bg-[#141414] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FF6200]/30 bg-[#FF6200]/15 text-[#FF8C42]">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-white">404 - Page Not Found</h2>
        <p className="mb-6 text-xs text-[#888898]">
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
