let currentTheme = 'light';

try {
  const saved = globalThis.localStorage?.getItem('nexusTheme');
  if (saved === 'dark' || saved === 'light') {
    currentTheme = saved;
  } else if (globalThis.window?.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
    currentTheme = 'dark';
  }
} catch {
  /* Ignore localStorage security error */
}

// Apply theme to DOM
export function applyThemeClass(theme) {
  if (typeof document === 'undefined' || !document.documentElement || !document.documentElement.classList) return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    if (typeof root.setAttribute === 'function') {
      root.setAttribute('data-theme', 'dark');
    }
  } else {
    root.classList.remove('dark');
    if (typeof root.setAttribute === 'function') {
      root.setAttribute('data-theme', 'light');
    }
  }
}

// Initial application
applyThemeClass(currentTheme);

const listeners = new Set();

export const getTheme = () => currentTheme;

export function setTheme(newTheme) {
  if (!['light', 'dark'].includes(newTheme) || newTheme === currentTheme) return;
  currentTheme = newTheme;
  applyThemeClass(currentTheme);
  try {
    globalThis.localStorage?.setItem('nexusTheme', currentTheme);
  } catch {
    /* Storage is optional */
  }
  listeners.forEach((listener) => listener(currentTheme));
}

export function subscribeTheme(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Toggle theme with circular ripple expansion originating precisely from buttonElement's geometric center.
 * @param {HTMLElement|null} buttonElement
 */
export function toggleTheme(buttonElement = null) {
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

  // Determine origin center coordinates (x, y)
  let x = window.innerWidth - 48;
  let y = 32;

  if (buttonElement && typeof buttonElement.getBoundingClientRect === 'function') {
    const rect = buttonElement.getBoundingClientRect();
    x = Math.round(rect.left + rect.width / 2);
    y = Math.round(rect.top + rect.height / 2);
  }

  // Calculate maximum distance to the furthest screen corner
  const maxRadius = Math.ceil(
    Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )
  );

  // Modern browser support: View Transitions API
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');

    const cleanup = () => {
      root.classList.remove('theme-transitioning');
    };

    let transition;
    try {
      transition = document.startViewTransition(() => {
        setTheme(nextTheme);
      });
    } catch {
      cleanup();
      setTheme(nextTheme);
      return;
    }

    transition.ready
      .then(() => {
        const anim = root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`
            ],
          },
          {
            duration: 480,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
        anim.onfinish = cleanup;
        anim.oncancel = cleanup;
      })
      .catch(cleanup);

    transition.finished.then(cleanup).catch(cleanup);
    return;
  }

  // Fallback for browsers without View Transitions (e.g. Firefox)
  if (typeof document !== 'undefined') {
    const isGoingDark = nextTheme === 'dark';
    const ripple = document.createElement('div');
    ripple.className = 'theme-transition-fallback-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = `${maxRadius * 2}px`;
    ripple.style.height = `${maxRadius * 2}px`;
    ripple.style.background = isGoingDark ? '#090d16' : '#f8fafc';
    document.body.appendChild(ripple);

    requestAnimationFrame(() => {
      ripple.classList.add('is-expanded');
      setTimeout(() => {
        setTheme(nextTheme);
        setTimeout(() => {
          if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
          }
        }, 220);
      }, 180);
    });
    return;
  }

  // Pure fallback
  setTheme(nextTheme);
}
