self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests - this dummy fetch handler is often required 
  // by Android Chrome to consider the app a true PWA and hide the address bar
});
