"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [key, setKey] = useState(0);

  // setiap route berubah, ulang animasi masuk (tanpa overlay)
  useEffect(() => {
    setKey((k) => k + 1);
  }, [pathname, search]);

  return (
    <div key={key} className="pageTransition" aria-live="polite">
      {children}
    </div>
  );
}
