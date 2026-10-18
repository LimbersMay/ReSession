import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',

  manifest: {
    name: 'ReSession',
    description: 'ReSession',
    version: '0.0.1',

    action: {
      default_popup: './popup/index.html'
    },

    permissions: ['storage']
  }
});
