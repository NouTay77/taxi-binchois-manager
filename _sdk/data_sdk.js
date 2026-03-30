window.dataSdk = {
  data: [],
  handler: null,

  async init(dataHandler) {
    this.handler = dataHandler;
    await this.load();
    return { isOk: true };
  },

  async load() {
    try {
      const response = await fetch('/api/sync-excel');
      if (response.ok) {
        this.data = await response.json();
        if (this.handler && this.handler.onDataChanged) {
          this.handler.onDataChanged(this.data);
        }
      }
    } catch (e) {
      console.error("Erreur de chargement des données:", e);
      // Repli sur le local si l'API échoue
      const saved = localStorage.getItem('dataSdk_data');
      if (saved) this.data = JSON.parse(saved);
    }
  },

  async create(item) {
    const newItem = { ...item, __backendId: Date.now().toString() };
    this.data.push(newItem);
    return await this.save();
  },

  async update(item) {
    const index = this.data.findIndex(d => d.__backendId === item.__backendId);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...item };
      return await this.save();
    }
    return { isOk: false, error: 'Non trouvé' };
  },

  async save() {
    // 1. Sauvegarde locale (sécurité)
    localStorage.setItem('dataSdk_data', JSON.stringify(this.data));
    
    // 2. Envoi vers le fichier Excel via l'API
    try {
      const response = await fetch('/api/sync-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data)
      });
      
      if (this.handler && this.handler.onDataChanged) {
        this.handler.onDataChanged(this.data);
      }
      return { isOk: response.ok };
    } catch (e) {
      return { isOk: false, error: e.message };
    }
  }
};