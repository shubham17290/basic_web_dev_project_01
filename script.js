/**
 * @license
 * Copyright (c) 2013, 2026, Oracle and/or its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * Shared client script for the JavaDoc documentation portal.
 */

(() => {
  "use strict";

  const THEME_STORAGE_KEY = "javadoc-portal-theme";
  const SUPPORTED_THEMES = ["dark", "light", "reading"];

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------

  const applyTheme = (theme) => {
    const root = document.documentElement;
    SUPPORTED_THEMES.forEach((value) => root.classList.remove(`theme-${value}`));
    root.classList.add(`theme-${theme}`);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  };

  const getStoredTheme = () => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return SUPPORTED_THEMES.includes(stored) ? stored : "dark";
  };

  const getNextThemeLabel = (theme) => {
    if (theme === "dark") return "Light Mode";
    if (theme === "light") return "Reading Mode";
    return "Dark Mode";
  };

  const getThemeIcon = (theme) => {
    if (theme === "dark") return "☀️";
    if (theme === "light") return "📖";
    return "🌙";
  };

  const initThemeSwitcher = () => {
    const switcher = document.querySelector("button.theme-switcher");
    if (!switcher) return;

    const updateThemeButton = (theme) => {
      switcher.innerHTML = `${getThemeIcon(theme)} <span>${getNextThemeLabel(theme)}</span>`;
      switcher.setAttribute('title', `Current theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode`);
    };

    applyTheme(getStoredTheme());
    updateThemeButton(getStoredTheme());

    switcher.addEventListener("click", () => {
      const current = getStoredTheme();
      const next =
        current === "dark" ? "light" : current === "light" ? "reading" : "dark";
      applyTheme(next);
      updateThemeButton(next);
    });
  };

  // ---------------------------------------------------------------------------
  // Clipboard (global handlers referenced from HTML onclick attributes)
  // ---------------------------------------------------------------------------

  const showCopyConfirmation = (button, labelElement) => {
    const copiedText = labelElement.getAttribute("data-copied") || "Copied!";
    const originalHtml = labelElement.innerHTML;

    button.classList.add("visible");
    labelElement.innerHTML = copiedText;

    setTimeout(() => {
      button.classList.remove("visible");
      setTimeout(() => {
        if (originalHtml !== copiedText) {
          labelElement.innerHTML = originalHtml;
        }
      }, 100);
    }, 1900);
  };

  window.copySnippet = (button) => {
    const snippet = button.nextElementSibling;
    if (snippet) {
      window.copyToClipboard(snippet.innerText, button);
    }
  };

  window.copyToClipboard = async (content, button) => {
    try {
      await navigator.clipboard.writeText(content);
      if (!button) return;

      const label = button.firstElementChild;
      if (label) {
        showCopyConfirmation(button, label);
      }
    } catch (error) {
      console.error("Clipboard copy failed:", error);
    }
  };

  // ---------------------------------------------------------------------------
  // Class directory search (allclasses.html)
  // ---------------------------------------------------------------------------

  const initClassDirectorySearch = () => {
    const searchInput = document.getElementById("classSearch");
    const resultCount = document.getElementById("resultCount");
    const cards = Array.from(document.querySelectorAll(".directory-card"));

    if (!searchInput || !resultCount || cards.length === 0) return;

    const updateResults = () => {
      const query = searchInput.value.trim().toLowerCase();
      let visibleCount = 0;

      cards.forEach((card) => {
        const name = (card.dataset.name || "").toLowerCase();
        const matches = name.includes(query);
        card.style.display = matches ? "grid" : "none";
        if (matches) visibleCount += 1;
      });

      resultCount.textContent = `${visibleCount} result${visibleCount === 1 ? "" : "s"}`;
    };

    searchInput.addEventListener("input", updateResults);
  };

  // ---------------------------------------------------------------------------
  // Scroll utilities
  // ---------------------------------------------------------------------------

  const updateScrollProgress = () => {
    const progress = document.querySelector(".scroll-progress");
    if (!progress) return;

    const scrollTop = window.scrollY;
    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    progress.style.width =
      scrollableHeight > 0 ? `${(scrollTop / scrollableHeight) * 100}%` : "0%";
  };

  const initBackToTop = () => {
    const button = document.querySelector(".back-to-top");
    if (!button) return;

    const toggleVisibility = () => {
      button.style.display = window.scrollY > 400 ? "flex" : "none";
    };

    window.addEventListener("scroll", toggleVisibility);
    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    toggleVisibility();
  };

  const initScrollSpy = () => {
    const headings = Array.from(document.querySelectorAll("main h2[id]"));
    const tocLinks = Array.from(document.querySelectorAll(".toc-list a"));

    if (headings.length === 0 || tocLinks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const link = tocLinks.find((item) => item.hash === `#${entry.target.id}`);
          if (!link) return;

          tocLinks.forEach((item) => item.classList.remove("active"));
          link.classList.add("active");
        });
      },
      { rootMargin: "-30% 0px -65% 0px", threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
  };

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    initThemeSwitcher();
    initBackToTop();
    initScrollSpy();
    initClassDirectorySearch();
    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress);
  });
})();
