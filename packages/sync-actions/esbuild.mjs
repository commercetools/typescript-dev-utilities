import esbuild from 'esbuild';
import { opts as options } from '../../esbuild.base.mjs';

const { outdir, ...opts } = options;

// commercetools-sync-actions.cjs.js [commonjs]
const cmJsConfig = esbuild.build(
  Object.assign({}, opts, {
    entryPoints: ['src/index.ts'],
    outfile: 'dist/commercetools-sync-actions.cjs.js',
  })
);

// commercetools-sync-actions.esm.js [module]
const moduleConfig = esbuild.build(
  Object.assign(
    {},
    { ...opts, format: 'esm', mainFields: ['module', 'main'] },
    {
      entryPoints: ['src/index.ts'],
      outfile: 'dist/commercetools-sync-actions.esm.js',
    }
  )
);

// commercetoolsSyncActions [umd - min]
const umdMinConfig = esbuild.build(
  Object.assign(
    {},
    { ...opts, format: 'cjs', minify: true },
    {
      entryPoints: ['src/index.ts'],
      outfile: 'dist/commercetools-sync-actions.umd.js',
    }
  )
);

// commercetoolsSyncActions [umd - min]
const umdIIFEConfig = esbuild.build(
  Object.assign(
    {},
    { ...opts, format: 'iife', minify: true },
    {
      entryPoints: ['src/index.ts'],
      outfile: 'dist/commercetools-sync-actions.umd.min.js',
      globalName: 'window["commercetoolsSyncActions"]',
    }
  )
);

Promise.all([cmJsConfig, moduleConfig, umdMinConfig, umdIIFEConfig]).catch(
  console.error
);
