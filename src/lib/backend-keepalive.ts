/**
 * Lightweight keep-alive ping for the Render backend.
 *
 * Render's free/starter tier spins down after ~15 min of inactivity.
 * A cold start can take 30-60+ seconds.  This module:
 *
 *  1. Fires a single HEAD request to `/api/health` as soon as the JS bundle
 *     loads (before React renders).  This wakes the backend so the real
 *     products API call completes faster.
 *
 *  2. Schedules a lightweight ping every 14 minutes while the tab stays open,
 *     keeping the backend alive for the duration of the user's session.
 *
 *  3. Pauses when the tab is hidden (document.visibilityState === 'hidden')
 *     and resumes when it becomes visible again.
 *
 * The entire module is fire-and-forget — errors are silently swallowed so
 * they never break the user experience.
 */

import { getApiEndpoint } from '@/lib/api';

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

let intervalId: ReturnType<typeof setInterval> | null = null;

function ping() {
  const url = getApiEndpoint('/api/health');
  if (!url) {
    return;
  }

  // Use fetch with a HEAD request — minimal payload, no CORS preflight for
  // simple requests, and we don't need to read the response body.
  fetch(url, { method: 'HEAD', cache: 'no-store', mode: 'cors' }).catch(() => {
    // Silently swallow — the backend may simply be starting up.
  });
}

function startInterval() {
  if (intervalId !== null) {
    return;
  }

  intervalId = setInterval(ping, PING_INTERVAL_MS);
}

function stopInterval() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // Tab became visible — fire an immediate ping (backend may have slept
    // while the user was away) and restart the periodic keep-alive.
    ping();
    startInterval();
  } else {
    // Tab hidden — stop pinging to save resources.
    stopInterval();
  }
}

/**
 * Call once at application startup (before React renders).
 * Fires the initial wake-up ping and sets up the recurring keep-alive.
 */
export function initBackendKeepAlive() {
  // Immediate wake-up ping
  ping();

  // Recurring keep-alive while the tab is open
  startInterval();

  // Respect tab visibility
  document.addEventListener('visibilitychange', handleVisibilityChange);
}
