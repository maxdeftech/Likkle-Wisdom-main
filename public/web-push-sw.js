self.addEventListener('push', (event) => {
  let payload = {
    title: 'Likkle Wisdom',
    body: 'New wisdom is ready fi yuh.',
    type: 'home',
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const url = payload.url || `/?push=${encodeURIComponent(payload.type || 'home')}`;

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: { url, type: payload.type || 'home' },
      tag: payload.tag || `likkle-wisdom-${payload.type || 'home'}`,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const origin = self.location.origin;
    const absoluteTarget = new URL(targetUrl, origin).href;

    for (const client of windows) {
      if (client.url.startsWith(origin) && 'focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(absoluteTarget);
        return;
      }
    }

    await self.clients.openWindow(absoluteTarget);
  })());
});
