import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/bitter/700.css';
import '@fontsource/bitter/800.css';
import './style.css';
import { mountLanding } from './landing.js';
import { loadProfile } from './util.js';

const app = document.getElementById('app');
let unmount = null;

async function route() {
  unmount?.();
  unmount = null;
  app.replaceChildren();

  const profile = loadProfile();
  const isArena = location.hash === '#/hang' || location.hash === '#/arena';

  if (isArena && profile.name) {
    const { mountCave } = await import('./cave.js');
    unmount = mountCave(app, {
      profile,
      onLeave: () => (location.hash = '#/'),
    });
  } else {
    if (location.hash !== '#/' && location.hash !== '') history.replaceState(null, '', '#/');
    unmount = mountLanding(app, {
      onEnter: () => (location.hash = '#/arena'),
    });
  }
}

addEventListener('hashchange', route);
document.fonts.ready.then(route);
