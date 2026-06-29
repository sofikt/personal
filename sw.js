// Service Worker — Pokémon Recordatorios
const CACHE = 'pk-reminders-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Recibe mensajes desde la app para programar notificaciones
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE') {
    scheduleAll(e.data.reminders);
  }
});

let timers = [];

function clearTimers() {
  timers.forEach(t => clearTimeout(t));
  timers = [];
}

function scheduleAll(reminders) {
  clearTimers();

  reminders.forEach(r => {
    if (!r.active) return;

    const now = new Date();
    const [h, m] = r.time.split(':').map(Number);

    let target = new Date();
    target.setHours(h, m, 0, 0);

    // Si ya pasó la hora hoy, programa para mañana (solo si es diario)
    if (target <= now) {
      if (r.repeat === 'daily') {
        target.setDate(target.getDate() + 1);
      } else {
        return; // "once" ya pasó, no programar
      }
    }

    const delay = target.getTime() - now.getTime();

    const t = setTimeout(() => {
      self.registration.showNotification(`${r.emoji} ${r.name}`, {
        body: `Son las ${r.time} — ¡hora de tu recordatorio!`,
        icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png',
        badge: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png',
        tag: r.id,
        renotify: true,
        requireInteraction: true
      });

      // Si es diario, re-programar para mañana
      if (r.repeat === 'daily') {
        scheduleAll(reminders);
      }
    }, delay);

    timers.push(t);
  });
}
