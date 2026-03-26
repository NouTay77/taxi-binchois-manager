window.elementSdk = {
  config: {},
  init(options) {
    this.config = { ...options.defaultConfig };
    // Load from localStorage if available
    const saved = localStorage.getItem('elementSdk_config');
    if (saved) {
      try {
        this.config = { ...this.config, ...JSON.parse(saved) };
      } catch (e) {}
    }
    if (options.onConfigChange) {
      // For simplicity, no real change listener
    }
    this.mapToCapabilities = options.mapToCapabilities;
    this.mapToEditPanelValues = options.mapToEditPanelValues;
  },
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('elementSdk_config', JSON.stringify(this.config));
  }
};