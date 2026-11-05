/**
 * Resolves the target WebSocket endpoint URL.
 * Automatically connects to local proxy during development or the production
 * relay server when hosted on static platforms like GitHub Pages.
 */
export function getWebSocketUrl() {
  const custom = localStorage.getItem('rasson_ws_url') || import.meta.env.VITE_WS_URL;
  if (custom) return custom;

  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}/ws`;
  }

  if (location.hostname.includes('onrender.com')) {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}/ws`;
  }

  // Production multiplayer relay server for static deployments (GitHub Pages, custom domains)
  return 'wss://hang-uit.onrender.com/ws';
}

/**
 * Manages real-time WebSocket connection to the Rasson Billiards server,
 * with automatic reconnection upon disconnection or server wakeup.
 */
export function connect(profile, handlers) {
  let ws = null;
  let closed = false;
  let retry = 0;
  let retryTimer = null;

  function open() {
    if (closed) return;
    const url = getWebSocketUrl();
    try {
      ws = new WebSocket(url);
    } catch (err) {
      console.warn('WebSocket connection attempt failed:', err);
      handlers.status?.('offline');
      scheduleRetry();
      return;
    }

    ws.onopen = () => {
      retry = 0;
      ws.send(
        JSON.stringify({
          t: 'join',
          name: profile.name,
          number: profile.number ?? 8,
          cueStyle: profile.cueStyle || 'ngocmy',
        }),
      );
      handlers.status?.('online');
    };

    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      handlers[msg.t]?.(msg);
    };

    ws.onerror = () => {
      // Handled in onclose
    };

    ws.onclose = () => {
      if (closed) return;
      handlers.status?.('offline');
      scheduleRetry();
    };
  }

  function scheduleRetry() {
    if (closed) return;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(open, Math.min(8000, 1000 * 1.5 ** retry++));
  }

  open();

  return {
    send(msg) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
        return true;
      }
      return false;
    },
    close() {
      closed = true;
      clearTimeout(retryTimer);
      ws?.close();
    },
  };
}
