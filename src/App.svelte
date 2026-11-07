<script>
  let count = $state(0);
</script>

<main>
  <h1>Inspector toggle repro</h1>
  <p>
    Open the dev server, then click the orange toggle button in the top-right
    corner. It has no effect.
  </p>
  <button id="counter" onclick={() => count++}>Clicks: {count}</button>
</main>
