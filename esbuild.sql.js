/* eslint-disable */
import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/sql.ts'],
  sourcemap: true,
  bundle: true,
  platform: 'node',
  target: ['ESNext'],
  outfile: 'dist/sql.js',
  format: "esm",
  packages: "external"
});
