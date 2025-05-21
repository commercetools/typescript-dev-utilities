import fs from 'fs';
import { build } from 'esbuild';

import { opts } from '../../esbuild.base.mjs';

await build({
  ...opts,
  entryPoints: {
    'bin/cli': `src/cli.ts`,
    'dist/main': `src/main.ts`,
  },
}).catch(console.error);

// make cli executable
console.log('🛠️ Setting executable permissions for CLI...');
fs.chmodSync(`bin/cli.js`, '755');

console.log('✅ Build complete!');
