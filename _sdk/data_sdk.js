window.dataSdk = {
  data: [],
  handler: null,

  async init(dataHandler) {
    this.handler = dataHandler;
    try {
      // 1. On va chercher les données sur Redis
      const res = await fetch('/api/sync-excel');
      if (res.ok) {
        const cloudData = await res.json();
        // Si le cloud a des données, on les utilise
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          this.data = cloudData;
          localStorage.setItem('dataSdk_data', JSON.stringify(this.data));
        } else {
          // Sinon on regarde dans le téléphone/PC (mémoire locale)
          const saved = localStorage.getItem('dataSdk_data');
          if (saved) this.data = JSON.parse(saved);
        }
      }
    } catch (e) {
      console.log("Erreur Cloud, lecture locale...");
      const saved = localStorage.getItem('dataSdk_data');
      if (saved) this.data = JSON.parse(saved);
    }
    
    if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
    return { isOk: true };
  },

  async create(item) {
    // On génère un ID unique pour que Redis ne s'emmêle pas les pinceaux
    const newItem = { ...item, __backendId: Date.now().toString(), active: true };
    this.data.push(newItem);
    await this.save();
    return { isOk: true };
  },

  async save() {
    // 1. Sauvegarde locale immédiate
    localStorage.setItem('dataSdk_data', JSON.stringify(this.data));
    if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
    
    // 2. Envoi au Cloud (Redis)
    try {
      await fetch('/api/sync-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data)
      });
    } catch (e) {
      console.error("Échec de la sauvegarde Cloud");
    }
  }
};