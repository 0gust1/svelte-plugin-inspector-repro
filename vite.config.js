import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The only relevant line is `showToggleButton: 'always'`.
// With the default `'active'` the button is only rendered while the inspector
// is already enabled, so the bug is not reachable.
export default defineConfig({
  plugins: [svelte({ inspector: { showToggleButton: 'always' } })]
});
