"use client";

import { useParams } from "next/navigation";
import Editor from "./Editor";
import "./editor.css";

export default function Page() {
  const params =
    useParams<{
      site: string;
    }>();

  if (!params.site) {
    return null;
  }

  return (
    <Editor
      siteSlug={params.site}
    />
  );
}