// Workbox 7.4.1, frozen source 4ea3138a120fd2c87389b54130e25f47e0fd7089.
// Registration only: existing shell checks and update lifecycle keep their authority.
import { Workbox } from './vendor/workbox-imported/window/Workbox';
window.F123WorkboxImported = async function(scriptURL) {
  const workbox = new Workbox(scriptURL, { updateViaCache: 'none' });
  const registration = await workbox.register();
  if (!registration) throw new Error('Worker registration unavailable');
  await registration.update();
  return registration;
};
