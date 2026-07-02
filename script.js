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
  const MOBILE_BREAKPOINT = 768; // Synced with CSS media query

  // ---------------------------------------------------------------------------
  // Utility Functions
  // ---------------------------------------------------------------------------

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

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
      switcher.setAttribute(
        "aria-label",
        `Current theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode. Click to switch to ${getNextThemeLabel(theme)}`
      );
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
  // Keyboard Shortcuts
  // ---------------------------------------------------------------------------

  const initKeyboardShortcuts = () => {
    document.addEventListener("keydown", (event) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
        return;
      }

      // Theme toggle: Press 'T' key
      if (event.key === "t" || event.key === "T") {
        const switcher = document.querySelector("button.theme-switcher");
        if (switcher) {
          event.preventDefault();
          switcher.click();
        }
      }

      // Back to top: Press 'Home' key
      if (event.key === "Home") {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
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

  const fallbackCopyToClipboard = (text, button) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful && button) {
        const label = button.firstElementChild;
        if (label) {
          showCopyConfirmation(button, label);
        }
      }
    } catch (err) {
      console.error("Fallback clipboard copy failed:", err);
    }

    document.body.removeChild(textArea);
  };

  window.copySnippet = (button) => {
    const codeCard = button.closest(".code-card");
    const snippet = codeCard ? codeCard.querySelector(".code-snippet, .code-block") : null;
    if (snippet) {
      window.copyToClipboard(snippet.innerText, button);
    }
  };

  window.copyToClipboard = async (content, button) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
        if (!button) return;

        const label = button.firstElementChild;
        if (label) {
          showCopyConfirmation(button, label);
        }
      } else {
        // Fallback for older browsers or non-secure contexts
        fallbackCopyToClipboard(content, button);
      }
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      // Try fallback if primary method fails
      if (navigator.clipboard) {
        fallbackCopyToClipboard(content, button);
      }
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

    // Debounce search input to improve performance
    const debouncedUpdateResults = debounce(updateResults, 300);
    searchInput.addEventListener("input", debouncedUpdateResults);
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

    const toggleVisibility = throttle(() => {
      button.style.display = window.scrollY > 400 ? "flex" : "none";
    }, 100);

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

    // Store observer reference for cleanup
    observer._headings = headings;
  };

  // ---------------------------------------------------------------------------
  // Mobile Navigation Toggle
  // ---------------------------------------------------------------------------

  const initMobileNavigation = () => {
    const navToggles = document.querySelectorAll(".nav-toggle");
    const navLinksContainers = document.querySelectorAll(".portal-nav__links, .redirect-nav__links");

    if (navToggles.length === 0) return;

    navToggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const isExpanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", !isExpanded);

        // Find the sibling links container
        const linksContainer = toggle.nextElementSibling;
        if (linksContainer && (linksContainer.classList.contains("portal-nav__links") || linksContainer.classList.contains("redirect-nav__links"))) {
          linksContainer.classList.toggle("active");
        }
      });
    });

    // Close mobile nav when clicking outside
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".portal-nav") && !event.target.closest(".redirect-nav")) {
        navToggles.forEach((toggle) => {
          toggle.setAttribute("aria-expanded", "false");
          const linksContainer = toggle.nextElementSibling;
          if (linksContainer && (linksContainer.classList.contains("portal-nav__links") || linksContainer.classList.contains("redirect-nav__links"))) {
            linksContainer.classList.remove("active");
          }
        });
      }
    });

    // Close mobile nav when window is resized to desktop
    const handleResize = throttle(() => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        navToggles.forEach((toggle) => {
          toggle.setAttribute("aria-expanded", "false");
          const linksContainer = toggle.nextElementSibling;
          if (linksContainer && (linksContainer.classList.contains("portal-nav__links") || linksContainer.classList.contains("redirect-nav__links"))) {
            linksContainer.classList.remove("active");
          }
        });
      }
    }, 100);

    window.addEventListener("resize", handleResize);
  };

  // ---------------------------------------------------------------------------
  // Search Result Highlighting
  // ---------------------------------------------------------------------------

  const initSearchHighlighting = () => {
    const searchInput = document.getElementById("classSearch");
    if (!searchInput) return;

    searchInput.addEventListener("input", debounce(() => {
      const query = searchInput.value.trim().toLowerCase();
      const cards = document.querySelectorAll(".directory-card");

      // Remove previous highlights
      cards.forEach((card) => {
        const titleElement = card.querySelector(".directory-card__content h2");
        if (titleElement && titleElement.dataset.originalText) {
          titleElement.innerHTML = titleElement.dataset.originalText;
          delete titleElement.dataset.originalText;
        }
      });

      // Add highlights to matching results
      if (query.length > 0) {
        cards.forEach((card) => {
          const name = (card.dataset.name || "").toLowerCase();
          if (name.includes(query) && card.style.display !== "none") {
            const titleElement = card.querySelector(".directory-card__content h2");
            if (titleElement && !titleElement.dataset.originalText) {
              const originalText = titleElement.textContent;
              titleElement.dataset.originalText = originalText;

              // Highlight matching text
              const regex = new RegExp(`(${query})`, "gi");
              titleElement.innerHTML = originalText.replace(regex, '<mark style="background: var(--color-primary-glow); color: var(--color-primary); padding: 2px 4px; border-radius: 2px;">$1</mark>');
            }
          }
        });
      }
    }, 300));
  };

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    initThemeSwitcher();
    initBackToTop();
    initScrollSpy();
    initClassDirectorySearch();
    initMobileNavigation();
    initKeyboardShortcuts();
    initSearchHighlighting();
    updateScrollProgress();
    
    // Throttle scroll progress updates for better performance
    const throttledScrollProgress = throttle(updateScrollProgress, 16); // ~60fps
    window.addEventListener("scroll", throttledScrollProgress);
  });
})();