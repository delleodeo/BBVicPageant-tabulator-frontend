import { defineStore } from 'pinia';
import { api } from '../services/api.js';

function mixColor(hex, target, amount) {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  return `#${channels.map((channel) => Math.round(channel * (1 - amount) + target * amount)
    .toString(16).padStart(2, '0')).join('')}`;
}

export const usePageantStore = defineStore('pageant', {
  state: () => ({ logo: '', themeColor: '#c99a2e' }),
  actions: {
    applySettings(pageant) {
      this.logo = pageant.logo || '';
      this.themeColor = /^#[0-9a-fA-F]{6}$/.test(pageant.themeColor || '') ? pageant.themeColor : '#c99a2e';
      const root = document.documentElement.style;
      if (this.themeColor.toLowerCase() === '#c99a2e') {
        for (const property of ['--gold', '--gold-light', '--gold-dark', '--gold-soft', '--border-gold', '--gold-glow']) {
          root.removeProperty(property);
        }
        return;
      }
      root.setProperty('--gold', this.themeColor);
      root.setProperty('--gold-light', mixColor(this.themeColor, 255, 35 / 100));
      root.setProperty('--gold-dark', mixColor(this.themeColor, 0, 25 / 100));
      root.setProperty('--gold-soft', mixColor(this.themeColor, 255, 90 / 100));
      root.setProperty('--border-gold', `${this.themeColor}66`);
      root.setProperty('--gold-glow', `${this.themeColor}55`);
    },
    async load() {
      const { data } = await api.get('/pageant');
      this.applySettings(data.pageant);
    }
  }
});
