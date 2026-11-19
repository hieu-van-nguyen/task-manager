/**
 * Registers public/service-worker.js in production builds only, so `npm start`
 * never serves stale cached files during development.
 */
export const registerServiceWorker = () => {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .catch(err => console.error('Service worker registration failed:', err));
  });
};
