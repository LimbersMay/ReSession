import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  console.log('ReSession background ready', { id: chrome.runtime.id });
});
