"use client";

export function navigateTo(path: string, e?: React.MouseEvent) {
  if (e) {
    e.preventDefault();
  }

  if (typeof window === "undefined") return;

  // Handle in-page section scrolling
  if (path.startsWith("#") && !path.startsWith("#/")) {
    const sectionId = path.replace("#", "");
    const isHome = window.location.pathname === "/" || window.location.pathname === "";

    if (!isHome) {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new Event("popstate"));
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
    return;
  }

  // Handle clean page navigation
  const cleanPath = path.startsWith("#/")
    ? path.slice(1)
    : path.startsWith("/")
    ? path
    : "/" + path;

  if (window.location.pathname !== cleanPath) {
    window.history.pushState(null, "", cleanPath);
    window.dispatchEvent(new Event("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
