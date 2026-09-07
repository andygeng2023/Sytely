"use client";

import { useParams } from "next/navigation";
import Editor from "./Editor";

export default function SiteEditorPage() {
  const params =
    useParams<{ site: string }>();

  if (!params?.site) {
    return null;
  }

  return (
    <Editor
      siteSlug={params.site}
    />
  );
}