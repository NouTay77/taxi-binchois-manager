async function initApp() {
  if (APP._isRestoring) return;
  APP._isRestoring = true;

  console.log('[Init] Démarrage complet...');

  // Attendre que dataSdk soit chargé
  await new Promise(r => setTimeout(r, 150));

  await window.dataSdk.init(dataHandler);
  await refreshAppData();

  // Restauration session
  const savedSessionID = localStorage.getItem('sessionID');
  if (savedSessionID) {
    try {
      const res = await fetch(`/api/store?sessionID=${encodeURIComponent(savedSessionID)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          APP.currentUser = json.user;
          APP.currentPage = json.user.role === 'admin' ? 'admin-dashboard' : 'chauffeur-main';
        }
      }
    } catch (e) {
      console.warn('[Session Restore] Échec', e);
    }
  }

  APP._isRestoring = false;
  render();
}