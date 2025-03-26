
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 733, hash: 'f914ebbac74b070be864ede075aa5af63c40b5ec46978c344e9cff7d0a5a01bd', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1052, hash: '8ee1fb74a2a913fe9678be017a9a92b795d8a5be7e0d8530a132c8c5f6e1047e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 20948, hash: 'dabf1f05a63cb01582d67ea723d6b73ab892dbbb91a5e191b817059aee4789ff', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-NYMY7RGE.css': {size: 69, hash: 'L8Vr5FZLVc0', text: () => import('./assets-chunks/styles-NYMY7RGE_css.mjs').then(m => m.default)}
  },
};
