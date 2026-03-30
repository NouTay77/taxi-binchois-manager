window.dataSdk = {
  data: [],
  handler: null,

  async init(dataHandler) {
    this.handler = dataHandler;
    // On charge les données du Cloud dès l'ouverture de l'app
    try {
      const res = await fetch('/api/sync-excel');
      if (res.ok) {
        const cloudData = await res.json();
        if (Array.isArray(cloudData)) {
          this.data = cloudData;
        }
      }
    } catch (e) {
      console.log("Erreur Cloud, lecture du stockage local...");
      const saved = localStorage.getItem('dataSdk_data');
      if (saved) this.data = JSON.parse(saved);
    }
    
    if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
    return { isOk: true };
  },

  async create(item) {
    // On force 'active: true' pour que le chauffeur puisse se connecter
    const newItem = { ...item, __backendId: Date.now().toString(), active: true };
    this.data.push(newItem);
    await this.save();
    return { isOk: true };
  },

  async update(item) {
    const index = this.data.findIndex(d => d.__backendId === item.__backendId);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...item };
      await this.save();
      return { isOk: true };
    }
    return { isOk: false };
  },

  async save() {
    // 1. Sauvegarde locale (pour la rapidité)
    localStorage.setItem('dataSdk_data', JSON.stringify(this.data));
    if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
    
    // 2. Envoi au Cloud Vercel (pour la synchronisation PC/Télephone)
    try {
      await fetch('/api/sync-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data)
      });
    } catch (e) {
      console.error("Échec de la synchronisation Cloud");
    }
  }
};