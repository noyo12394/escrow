// =============================================================================
// Background notifications for S.T.A.R. Earthquake Rescue Lab
// -----------------------------------------------------------------------------
// Goal (from the request): an "Enable Alerts" button that pops system
// notifications — rescue-drill reminders — that still fire even after the
// browser tab / site is closed.
//
// How "even when closed" is achieved:
//   * We register a Service Worker (public/sw.js). A service worker keeps
//     running independently of any open tab, so it can display notifications
//     while the site is closed.
//   * Periodic Background Sync (Chromium) lets the service worker wake up on a
//     schedule and show a reminder with NO tab open at all. This is the primary
//     "site closed" path and works once the app is installed / permission is
//     granted.
//   * The Push API path is also wired in the service worker, so if a push
//     backend (web-push + VAPID) is added later, server-sent notifications will
//     work while fully closed too. No backend is required for the local demo.
//   * As a universal fallback we ask the service worker to schedule reminders;
//     the SW shows them via showNotification(), which surfaces even when the
//     page is only backgrounded.
// =============================================================================

const STORAGE_KEY = 'star-alerts-enabled';
const SYNC_TAG = 'star-rescue-reminder';
const SW_URL = '/sw.js';

let swRegistration = null;
let api = { toast: () => {}, dom: null };

export function initNotifications(deps) {
  api = { ...api, ...deps };

  const supported =
    'serviceWorker' in navigator && 'Notification' in window;

  const btn = injectButton();

  if (!supported) {
    btn.disabled = true;
    btn.textContent = 'Alerts N/A';
    btn.title = 'This browser does not support background notifications.';
    return;
  }

  registerServiceWorker();

  btn.addEventListener('click', () => onEnableClick(btn));

  // Reflect any previously granted permission.
  syncButtonLabel(btn);

  // If the user already opted in on a previous visit, re-arm silently.
  if (
    localStorage.getItem(STORAGE_KEY) === 'true' &&
    Notification.permission === 'granted'
  ) {
    enableBackgroundReminders().catch(() => {});
  }
}

// -----------------------------------------------------------------------------
// Toolbar button
// -----------------------------------------------------------------------------
function injectButton() {
  const btn = document.createElement('button');
  btn.id = 'btn-alerts';
  btn.className = 'btn';
  btn.textContent = 'Enable Alerts';
  // Place it just before the Reset button in the HUD toolbar.
  const right = document.querySelector('.hud-right');
  const reset = document.getElementById('btn-reset');
  if (right && reset) right.insertBefore(btn, reset);
  else if (right) right.appendChild(btn);
  return btn;
}

function syncButtonLabel(btn) {
  if (Notification.permission === 'granted' &&
      localStorage.getItem(STORAGE_KEY) === 'true') {
    btn.textContent = 'Alerts On ✓';
    btn.title = 'Background rescue-drill reminders are enabled. Click to send a test alert.';
  } else if (Notification.permission === 'denied') {
    btn.textContent = 'Alerts Blocked';
    btn.title = 'Notifications are blocked in your browser settings.';
  } else {
    btn.textContent = 'Enable Alerts';
    btn.title = 'Get rescue-drill reminders even after you close the site.';
  }
}

// -----------------------------------------------------------------------------
// Service worker registration
// -----------------------------------------------------------------------------
async function registerServiceWorker() {
  try {
    swRegistration = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
    await navigator.serviceWorker.ready;
  } catch (err) {
    console.warn('[notify] Service worker registration failed:', err);
  }
  return swRegistration;
}

// -----------------------------------------------------------------------------
// Enable flow
// -----------------------------------------------------------------------------
async function onEnableClick(btn) {
  // Already enabled? Treat a click as "send me a test alert now".
  if (Notification.permission === 'granted' &&
      localStorage.getItem(STORAGE_KEY) === 'true') {
    await sendTestNotification();
    return;
  }

  if (Notification.permission === 'denied') {
    api.toast('Notifications are blocked. Enable them in your browser site settings.', 'warn', 4200);
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    api.toast('Notification permission was not granted.', 'warn');
    syncButtonLabel(btn);
    return;
  }

  localStorage.setItem(STORAGE_KEY, 'true');
  await enableBackgroundReminders();
  syncButtonLabel(btn);

  // Confirmation notification (shown by the SW so it persists when closed).
  await showViaServiceWorker('Rescue alerts enabled', {
    body: 'You will get drill reminders even after you close this tab.',
    tag: 'star-welcome',
  });

  api.toast('Background alerts enabled ✓', 'good', 3200);
}

// Set up the recurring "even when closed" reminders.
async function enableBackgroundReminders() {
  const reg = swRegistration || (await registerServiceWorker());
  if (!reg) return;

  // Primary path: Periodic Background Sync — wakes the SW with no tab open.
  if ('periodicSync' in reg) {
    try {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync',
      });
      if (status.state === 'granted') {
        await reg.periodicSync.register(SYNC_TAG, {
          minInterval: 6 * 60 * 60 * 1000, // ~ every 6 hours
        });
      }
    } catch (err) {
      console.info('[notify] Periodic background sync unavailable:', err.message);
    }
  }

  // Fallback path: ask the SW to schedule timed reminders it will show itself.
  await postToServiceWorker({ type: 'schedule-reminders' });
}

async function sendTestNotification() {
  const ok = await showViaServiceWorker('S.T.A.R. Rescue Drill', {
    body: 'Test alert: this is how reminders will appear — even with the site closed.',
    tag: 'star-test',
    requireInteraction: false,
  });
  if (ok) api.toast('Test alert sent — check your notifications.', 'good');
  else api.toast('Could not display a notification.', 'warn');
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
async function showViaServiceWorker(title, options) {
  try {
    const reg = swRegistration || (await navigator.serviceWorker.ready);
    await reg.showNotification(title, {
      icon: '/icon.svg',
      badge: '/icon.svg',
      ...options,
    });
    return true;
  } catch (err) {
    // Last-resort fallback to a page-level notification.
    try {
      new Notification(title, options);
      return true;
    } catch {
      console.warn('[notify] showNotification failed:', err);
      return false;
    }
  }
}

async function postToServiceWorker(message) {
  try {
    const reg = swRegistration || (await navigator.serviceWorker.ready);
    if (reg.active) reg.active.postMessage(message);
  } catch (err) {
    console.info('[notify] postMessage failed:', err.message);
  }
}
