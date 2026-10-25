import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import PublishedSite from "./components/PublishedSite";
import "./styles.css";

const siteSlug = new URLSearchParams(window.location.search).get("site");

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {siteSlug ? <PublishedSite slug={siteSlug} /> : <App />}
  </React.StrictMode>,
);