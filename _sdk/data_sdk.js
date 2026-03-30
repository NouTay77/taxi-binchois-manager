window.dataSdk = {
  data: [],
  handler: null,
  lastSyncHash: null,
  pollingInterval: null,

  async init(dataHandler) {
    this.handler = dataHandler;
    try {
      // 1. On va chercher les données sur Redis via sync-excel
      try {
        const res = await fetch('/api/sync-excel', { timeout: 5000 });
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
          throw new Error('API returned ' + res.status);
        }
      } catch (apiErr) {
        console.log("Erreur Cloud (peut être normal en local):", apiErr.message);
        const saved = localStorage.getItem('dataSdk_data');
        if (saved) {
          this.data = JSON.parse(saved);
          this.lastSyncHash = saved;
        }
      }
    } catch (e) {
      console.error("Erreur init SDK:", e);
      const saved = localStorage.getItem('dataSdk_data');
      if (saved) {
        try {
          this.data = JSON.parse(saved);
          this.lastSyncHash = saved;
        } catch (parseErr) {
          console.error("Erreur parsing localStorage:", parseErr);
          this.data = [];
        }
      }
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
        const res = await fetch('/api/sync-excel', { timeout: 5000 });
        if (res.ok) {
          const cloudData = await res.json();
          if (Array.isArray(cloudData)) {
            const cloudHash = JSON.stringify(cloudData);
            
            // Si les données ont changé depuis un autre appareil
            if (cloudHash !== this.lastSyncHash) {
              this.data = cloudData;
              this.lastSyncHash = cloudHash;
              localStorage.setItem('dataSdk_data', JSON.stringify(this.data));
              if (this.handler?.onDataChanged) {
                try {
                  this.handler.onDataChanged(this.data);
                } catch (err) {
                  console.error("Erreur onDataChanged lors polling:", err);
                }
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
      return { isOk: true, item: newItem };
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
      // 1. Sauvegarde locale immédiate
      const dataStr = JSON.stringify(this.data);
      localStorage.setItem('dataSdk_data', dataStr);
      this.lastSyncHash = dataStr;
      
      if (this.handler?.onDataChanged) {
        try {
          this.handler.onDataChanged(this.data);
        } catch (err) {
          console.error("Erreur onDataChanged save:", err);
        }
      }
      
      // 2. Envoi au Cloud (Redis/sync-excel) - ne pas bloquer si erreur
      try {
        await fetch('/api/sync-excel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: dataStr,
          timeout: 5000
        });
      } catch (cloudErr) {
        // Erreur cloud = pas grave, données sauvegardées localement
        console.log("Note: Cloud sync échoué (normal en dev):", cloudErr.message);
      }
    } catch (err) {
      console.error("Erreur save:", err);
    }
  }
};