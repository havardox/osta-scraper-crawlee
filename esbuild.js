/* eslint-disable */
import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/main.ts'],
  sourcemap: true,
  bundle: true,
  platform: 'node',
  target: ['ESNext'],
  outfile: 'dist/out.js',
  format: "esm",
  packages: "external"
});
