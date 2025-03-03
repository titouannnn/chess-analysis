
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/chess-board"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 681, hash: 'd05111dd680d643c2c80df827c94ccf51585094ef1378a2bde76f4d0ecc29513', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1000, hash: '0bacbac8ce78abee76f17c95f3f7473a3461bfe9c4e2858722489bfc51c4d6fd', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'chess-board/index.html': {size: 23327, hash: '3dab98959c4712a271e82a84bab36b9364b3662d001c6e74e2dd61f082ce560e', text: () => import('./assets-chunks/chess-board_index_html.mjs').then(m => m.default)},
    'styles-NYMY7RGE.css': {size: 69, hash: 'L8Vr5FZLVc0', text: () => import('./assets-chunks/styles-NYMY7RGE_css.mjs').then(m => m.default)}
  },
};
