# vite-plugin-svelte inspector: toggle button does nothing

Minimal reproduction for `@sveltejs/vite-plugin-svelte` inspector toggle button being
unresponsive when `showToggleButton: 'always'`.

## Expected vs actual

- **Expected:** clicking the orange toggle button (top-right) enables the inspector —
  `document.body` gains `svelte-inspector-enabled` and an overlay appears.
- **Actual:** nothing happens. `enable()` runs, then `disable()` runs immediately
  afterwards from the inspector's own `svelte:window` handler.

## Versions

```
@sveltejs/vite-plugin-svelte 7.3.1
svelte                       5.57.x
vite                         8.3.x
```

## Steps to reproduce

```bash
npm install
npm run dev
```

1. Open the printed URL (default http://localhost:5173).
2. Click the orange toggle button in the top-right corner.
3. Observe: nothing happens. The console is clean — no errors.

Verify in the devtools console:

```js
document.body.classList.contains('svelte-inspector-enabled'); // false, before and after
document.getElementById('svelte-inspector-toggle').getAttribute('aria-label');
// "enable svelte-inspector" — stays "enable" after clicking
```

## Why `showToggleButton: 'always'` matters

`src/plugins/inspector/runtime/Inspector.svelte` computes:

```js
let show_toggle = $derived(
	options.showToggleButton === 'always' || (options.showToggleButton === 'active' && enabled)
);
```

With the default `'active'`, the button is only rendered while the inspector is already
enabled, so it is never clickable in the broken direction and the bug is invisible.
`'always'` is what makes it reachable.

The component binds two competing handlers:

```svelte
<svelte:window onclick={disable} />                              <!-- line 422 -->

<button id="svelte-inspector-toggle" onclick={() => toggle()}>   <!-- line 438 -->
```

A click on the toggle calls `toggle() -> enable()`, bubbles to `window`, and `disable()`
immediately undoes it. Instrumenting `document.body.classList` shows:

```
toggle-handler
add:svelte-inspector-enabled      <- enable() worked
after-toggle body=svelte-inspector-enabled
remove:svelte-inspector-enabled   <- disable() undid it
```

Stack for the removal:

```
at disable (…/inspector/runtime/Inspector.svelte:395)
at target_handler (svelte internal client dom/elements/events.js)
at without_reactive_context
```

`<svelte:window>` compiles to `$.event('click', $.window, disable)` — a plain
`addEventListener` on `window` that runs on bubble, *after* the delegated toggle handler.
Svelte's delegated de-duplication (`event[event_symbol]`) does not suppress it.

## Workaround

```js
// svelte.config.js / vite.config.js
svelte({ inspector: { showToggleButton: 'active' } }) // default; button only shown when enabled
```

## Suggested fix

`packages/vite-plugin-svelte/src/plugins/inspector/runtime/Inspector.svelte`

```diff
 <svelte:window
-	onclick={disable}
+	onclick={(e) => {
+		// The toggle handles its own clicks; disabling here would cancel it.
+		const t = e.target;
+		if (t instanceof Element && t.closest('#svelte-inspector-toggle')) return;
+		disable();
+	}}
 	onkeydown={(e) => {
```
