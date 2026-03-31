window.dataSdk = {
  data: [],
  handler: null,
  lastSyncHash: null,
  pollingInterval: null,

  async init(dataHandler) {
    this.handler = dataHandler;
    try {
      // Charger les données UNIQUEMENT depuis Redis via sync-excel
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/api/sync-excel', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.status === 503) {
        const err = await res.json();
        throw new Error('Base de données non disponible: ' + (err.error || 'Redis non configuré'));
      }
      
      if (!res.ok) {
        console.warn('Statut HTTP non-OK, initialisation à vide');
        this.data = [];
      } else {
        const cloudData = await res.json();
        this.data = Array.isArray(cloudData) ? cloudData : [];
        this.lastSyncHash = JSON.stringify(this.data);
        console.log('SDK initialisé avec', this.data.length, 'records depuis Redis');
        
        // Log global des utilisateurs
        const users = this.data.filter(d => d.type === 'user');
        console.log('SDK Init - Utilisateurs:', users.length, '| Admins:', users.filter(u => u.role === 'admin').length);
      }
    } catch (e) {
      console.error("Erreur fatale lors du chargement Redis:", e);
      this.data = []; // Fallback pour éviter les erreurs de mapping
      return { isOk: false, error: e.message };
    }
    
    if (this.handler?.onDataChanged) {
      try {
        this.handler.onDataChanged(this.data);
      } catch (err) {
        console.error("Erreur onDataChanged:", err);
      }
    }
    
    // Lancer le polling toutes les 3 secondes pour vérifier les changements distants
    this.startPolling();
    
    return { isOk: true };
  },

  startPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    
    this.pollingInterval = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('/api/sync-excel', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const cloudData = await res.json();
          const dataArray = Array.isArray(cloudData) ? cloudData : [];
          const cloudHash = JSON.stringify(dataArray);
            
          // Si les données ont changé depuis un autre appareil
          if (cloudHash !== this.lastSyncHash) {
            this.data = dataArray;
            this.lastSyncHash = cloudHash;
            console.log('Sync Auto depuis Redis:', this.data.length, 'records');
            
            const users = this.data.filter(d => d.type === 'user');
            const adminCount = users.filter(u => u.role === 'admin').length;
            console.log('Sync Auto Redis - Utilisateurs:', users.length, '| Admins:', adminCount);
            
            if (adminCount === 0) console.warn('⚠️ Alerte : Aucun Admin détecté dans APP.allData après polling !');

            if (this.handler?.onDataChanged) {
              try {
                this.handler.onDataChanged(this.data);
              } catch (err) {
                console.error("Erreur onDataChanged lors polling:", err);
              }
            }
          }
        }
      } catch (e) {
        // Polling fail silently - c'est normal si l'API n'existe pas
      }
    }, 3000); // Vérifie chaque 3 secondes
  },

  async create(item) {
    try {
      // On génère un ID unique pour que Redis ne s'emmêle pas les pinceaux
      const newItem = { ...item, __backendId: Date.now().toString() + Math.random().toString(36).substr(2,5), active: true };
      this.data.push(newItem);
      await this.save();
      return { isOk: true, data: newItem }; // Retourne 'data' pour correspondre au frontend
    } catch (err) {
      console.error("Erreur create:", err);
      return { isOk: false, error: err.message };
    }
  },

  async update(item) {
    try {
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
    } catch (err) {
      console.error("Erreur update:", err);
      return { isOk: false, error: err.message };
    }
  },

  async delete(item) {
    try {
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
    } catch (err) {
      console.error("Erreur delete:", err);
      return { isOk: false, error: err.message };
    }
  },

  async save() {
    try {
      // Mise à jour du hash
      this.lastSyncHash = JSON.stringify(this.data);
      
      // Callback obligatoire
      if (this.handler?.onDataChanged) {
        try {
          this.handler.onDataChanged(this.data);
        } catch (err) {
          console.error("Erreur onDataChanged save:", err);
        }
      }
      
      // Sauvegarde OBLIGATOIRE dans Redis
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('/api/sync-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error('Redis save échoué HTTP ' + response.status + ': ' + errText);
      }
      
      console.log('Données sauvegardées dans Redis');
    } catch (err) {
      console.error("Erreur CRITIQUE save (données non sauvegardées):", err);
      throw err; // Re-lancer l'erreur pour que le caller le sache
    }
  }
};