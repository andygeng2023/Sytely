"use client";

import { useEffect, useState } from "react";
import { SytelyRenderer } from "@sytely/renderer";
import type { Site } from "@sytely/types";

export default function PreviewPage() {
  const [site, setSite] = useState<Site | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sytely-site");

    if (saved) {
      setSite(JSON.parse(saved));
    }
  }, []);

  if (!site) {
    return <div>Loading preview...</div>;
  }

  const params = new URLSearchParams(
    window.location.search
  );

  const requested =
    params.get("page") || "/";

  const page =
    site.pages.find(
      (item) =>
        item.settings.slug === requested
    ) ||
    site.pages[0];

  return (
    <main
      style={{
        fontFamily: site.theme.fontFamily
      }}
    >
      <SytelyRenderer
        nodes={page.components}
        breakpoint="desktop"
      />
    </main>
  );
}