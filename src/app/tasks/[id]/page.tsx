"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TaskDirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const taskId = params?.id;
    if (taskId) {
      router.replace(`/?tab=work-packages&task=${taskId}`);
    } else {
      router.replace(`/?tab=work-packages`);
    }
  }, [params, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white text-white">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <div className="w-5 h-5 border-2 border-[#FF6200] border-t-transparent rounded-full animate-spin" />
        <span>Opening Work Package #{params?.id}...</span>
      </div>
    </div>
  );
}
