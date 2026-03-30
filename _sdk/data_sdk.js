window.dataSdk = {
  data: [],
  handler: null,
  lastSyncHash: null,
  pollingInterval: null,

  async init(dataHandler) {
    this.handler = dataHandler;
    try {
      // 1. On va chercher les données sur Redis via sync-excel
      const res = await fetch('/api/sync-excel');
      if (res.ok) {
        const cloudData = await res.json();
        // Si le cloud a des données, on les utilise
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          this.data = cloudData;
          localStorage.setItem('dataSdk_data', JSON.stringify(this.data));
          this.lastSyncHash = JSON.stringify(this.data);
        } else {
          // Sinon on regarde dans le téléphone/PC (mémoire locale)
          const saved = localStorage.getItem('dataSdk_data');
          if (saved) {
            this.data = JSON.parse(saved);
            this.lastSyncHash = saved;
          }
        }
      } else {
        const saved = localStorage.getItem('dataSdk_data');
        if (saved) {
          this.data = JSON.parse(saved);
          this.lastSyncHash = saved;
        }
      }
    } catch (e) {
      console.log("Erreur Cloud, lecture locale...");
      const saved = localStorage.getItem('dataSdk_data');
      if (saved) {
        this.data = JSON.parse(saved);
        this.lastSyncHash = saved;
      }
    }
    
    if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
    
    // Lancer le polling toutes les 3 secondes pour vérifier les changements distants
    this.startPolling();
    
    return { isOk: true };
  },

  startPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    
    this.pollingInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/sync-excel');
        if (res.ok) {
          const cloudData = await res.json();
          const cloudHash = JSON.stringify(cloudData);
          
          // Si les données ont changé depuis un autre appareil
          if (cloudHash !== this.lastSyncHash) {
            this.data = cloudData;
            this.lastSyncHash = cloudHash;
            localStorage.setItem('dataSdk_data', JSON.stringify(this.data));
            if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
          }
        }
      } catch (e) {
        // Polling fail silently
      }
    }, 3000); // Vérifie chaque 3 secondes
  },

  async create(item) {
    // On génère un ID unique pour que Redis ne s'emmêle pas les pinceaux
    const newItem = { ...item, __backendId: Date.now().toString() + Math.random().toString(36).substr(2,5), active: true };
    this.data.push(newItem);
    await this.save();
    return { isOk: true, item: newItem };
  },

  async update(item) {
    // Chercher l'item à mettre à jour par __backendId
    if (!item || !item.__backendId) {
      return { isOk: false, error: 'Missing __backendId' };
    }
    
    const index = this.data.findIndex(d => d.__backendId === item.__backendId);
    if (index === -1) {
      return { isOk: false, error: 'Item not found' };
    }
    
    // Remplacer l'item tout en gardant tous les champs
    this.data[index] = { ...this.data[index], ...item };
    await this.save();
    return { isOk: true, item: this.data[index] };
  },

  async delete(item) {
    // Supprimer l'item par __backendId
    if (!item || !item.__backendId) {
      return { isOk: false, error: 'Missing __backendId' };
    }
    
    const index = this.data.findIndex(d => d.__backendId === item.__backendId);
    if (index === -1) {
      return { isOk: false, error: 'Item not found' };
    }
    
    this.data.splice(index, 1);
    await this.save();
    return { isOk: true };
  },

  async save() {
    // 1. Sauvegarde locale immédiate
    const dataStr = JSON.stringify(this.data);
    localStorage.setItem('dataSdk_data', dataStr);
    this.lastSyncHash = dataStr;
    
    if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
    
    // 2. Envoi au Cloud (Redis/sync-excel)
    try {
      await fetch('/api/sync-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: dataStr
      });
    } catch (e) {
      console.error("Échec de la sauvegarde Cloud:", e);
    }
  }
};