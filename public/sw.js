/* =============================================================================
 * S.T.A.R. Earthquake Rescue Lab - Service Worker
 * -----------------------------------------------------------------------------
 * Runs independently of any open tab, so it can display notifications even
 * after the site is closed. Handles:
 *   - install / activate lifecycle
 *   - periodicsync  -> recurring reminders with NO tab open (Chromium)
 *   - push          -> server-sent notifications (works fully closed) if a
 *                      web-push backend is added later
 *   - message       -> page asks the SW to schedule timed reminders
 *   - notificationclick -> focus / open the app
 * ========================================================================== */

const REMINDERS = [
  {
    title: 'S.T.A.R. Rescue Check-In',
    body: 'Monitor the battery radio for emergency updates and check the team.',
  },
  {
    title: 'S.T.A.R. Water Reminder',
    body: 'Ration water carefully — secure and purify your supply before food.',
  },
  {
    title: 'S.T.A.R. Signal Reminder',
    body: 'Run your day/night signaling so rescuers can locate you.',
  },
  {
    title: 'S.T.A.R. Safety Reminder',
    body: 'Keep utilities off and open flames away — stay safe until rescue.',
  },
];

function pickReminder() {
  return REMINDERS[Math.floor(Math.random() * REMINDERS.length)];
}

function showReminder(extra = {}) {
  const r = pickReminder();
  return self.registration.showNotification(r.title, {
    body: r.body,
    tag: 'star-reminder',
    icon: '/icon.svg',
    badge: '/icon.svg',
    renotify: true,
    data: { url: '/' },
    ...extra,
  });
}

// --- Lifecycle --------------------------------------------------------------
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// --- Periodic Background Sync: fires while the site is closed ----------------
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'star-rescue-reminder') {
    event.waitUntil(showReminder());
  }
});

// --- One-off Background Sync fallback ---------------------------------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'star-rescue-reminder') {
    event.waitUntil(showReminder());
  }
});

// --- Push: server-sent notifications (fully closed) -------------------------
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'S.T.A.R. Rescue Alert', body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'S.T.A.R. Rescue Alert', {
      body: payload.body || 'New rescue update.',
      tag: payload.tag || 'star-push',
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: payload.url || '/' },
    })
  );
});

// --- Messages from the page: schedule timed reminders -----------------------
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'schedule-reminders') {
    // Schedule a few reminders. setTimeout fires while the SW is alive (and the
    // browser keeps SWs alive in the background); periodicsync covers the rest.
    const delays = msg.delays || [60 * 1000, 30 * 60 * 1000, 2 * 60 * 60 * 1000];
    for (const ms of delays) {
      setTimeout(() => showReminder(), ms);
    }
  }
  if (msg.type === 'show-now') {
    showReminder({ tag: 'star-now', renotify: true });
  }
});

// --- Clicking a notification focuses or opens the app -----------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
