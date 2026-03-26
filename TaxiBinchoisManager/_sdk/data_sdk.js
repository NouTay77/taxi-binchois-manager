window.dataSdk = {
  data: [],
  handler: null,
  async init(dataHandler) {
    this.handler = dataHandler;
    // Load from localStorage
    const saved = localStorage.getItem('dataSdk_data');
    if (saved) {
      try {
        this.data = JSON.parse(saved);
      } catch (e) {
        this.data = [];
      }
    } else {
      this.data = [];
    }
    if (this.handler && this.handler.onDataChanged) {
      this.handler.onDataChanged(this.data);
    }
    return { isOk: true };
  },
  async create(item) {
    try {
      const newItem = { ...item, __backendId: Date.now().toString() };
      this.data.push(newItem);
      this.save();
      if (this.handler && this.handler.onDataChanged) {
        this.handler.onDataChanged(this.data);
      }
      return { isOk: true };
    } catch (e) {
      return { isOk: false, error: e.message };
    }
  },
  async update(item) {
    try {
      const index = this.data.findIndex(d => d.__backendId === item.__backendId);
      if (index === -1) {
        return { isOk: false, error: 'Item not found' };
      }
      this.data[index] = { ...this.data[index], ...item };
      this.save();
      if (this.handler && this.handler.onDataChanged) {
        this.handler.onDataChanged(this.data);
      }
      return { isOk: true };
    } catch (e) {
      return { isOk: false, error: e.message };
    }
  },
  async delete(item) {
    try {
      this.data = this.data.filter(d => d.__backendId !== item.__backendId);
      this.save();
      if (this.handler && this.handler.onDataChanged) {
        this.handler.onDataChanged(this.data);
      }
      return { isOk: true };
    } catch (e) {
      return { isOk: false, error: e.message };
    }
  },
  save() {
    localStorage.setItem('dataSdk_data', JSON.stringify(this.data));
  }
};