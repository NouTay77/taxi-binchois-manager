window.dataSdk = {
  data: [],
  handler: null,

  async init(dataHandler) {
    this.handler = dataHandler;
    // On charge d'abord ce qu'on a sous la main (Local)
    const saved = localStorage.getItem('dataSdk_data');
    if (saved) {
      this.data = JSON.parse(saved);
      if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
    }
    // Puis on tente la synchro
    await this.loadFromServer();
    return { isOk: true };
  },

  async loadFromServer() {
    try {
      // On force un POST avec une commande "read" si le GET est interdit
      const res = await fetch('/api/sync-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }) 
      });
      if (res.ok) {
        const serverData = await res.json();
        if (Array.isArray(serverData)) {
          this.data = serverData;
          localStorage.setItem('dataSdk_data', JSON.stringify(this.data));
          if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
        }
      }
    } catch (e) { console.error("Synchro impossible"); }
  },

  async create(item) {
    const newItem = { ...item, __backendId: Date.now().toString(), active: true };
    this.data.push(newItem);
    return await this.save();
  },

  async save() {
    localStorage.setItem('dataSdk_data', JSON.stringify(this.data));
    if (this.handler?.onDataChanged) this.handler.onDataChanged(this.data);
    
    try {
      const res = await fetch('/api/sync-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data) // On envoie toute la liste
      });
      return { isOk: res.ok };
    } catch (e) {
      return { isOk: true }; // On ne bloque pas l'utilisateur si le réseau flanche
    }
  }
};