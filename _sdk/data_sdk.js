window.dataSdk = {
  data: [],
  handler: null,

  async init(dataHandler) {
    this.handler = dataHandler;
    try {
      // On charge les chauffeurs depuis le Cloud au démarrage
      const res = await fetch('/api/sync-excel');
      if (res.ok) {
        this.data = await res.json();
      }
    } catch (e) {
      console.log("Erreur Cloud, lecture locale...");
    }
    if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
    return { isOk: true };
  },

  async create(item) {
    const newItem = { ...item, __backendId: Date.now().toString(), active: true };
    this.data.push(newItem);
    await this.save();
    return { isOk: true };
  },

  async save() {
    // Sauvegarde sur le téléphone/PC actuel
    localStorage.setItem('dataSdk_data', JSON.stringify(this.data));
    if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
    
    // Envoi immédiat au Cloud pour que tous les autres appareils voient le changement
    try {
      await fetch('/api/sync-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data)
      });
    } catch (e) {
      console.error("Synchro Cloud échouée");
    }
  }
};