<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let pending = $state(false);
</script>

<svelte:head><title>Sign in · Training 2026</title></svelte:head>

<div class="wrap">
  <header>
    <p class="kicker">Training 2026</p>
    <h1>Sign in</h1>
  </header>

  <form
    method="POST"
    use:enhance={() => {
      pending = true;
      return async ({ update }) => {
        await update();
        pending = false;
      };
    }}
  >
    <input type="hidden" name="next" value={data.next} />

    <label>
      <span>Username or email</span>
      <input
        name="identifier"
        type="text"
        autocomplete="username"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        required
        value={form?.identifier ?? ''}
      />
    </label>

    <label>
      <span>Password</span>
      <input name="password" type="password" autocomplete="current-password" required />
    </label>

    {#if form?.error}
      <p class="error" role="alert">{form.error}</p>
    {/if}

    <button type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
  </form>
</div>

<style>
  .wrap {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 2rem 1.25rem;
  }
  header {
    text-align: center;
    margin-bottom: 2rem;
  }
  .kicker {
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--fg-muted, #6b6b6b);
    margin: 0 0 0.4rem;
  }
  h1 {
    font-size: 1.6rem;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.01em;
  }
  form {
    display: grid;
    gap: 1rem;
    width: 100%;
    max-width: 320px;
  }
  label {
    display: grid;
    gap: 0.35rem;
  }
  label span {
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--fg-muted, #6b6b6b);
  }
  input {
    border: none;
    border-bottom: 1px solid var(--rule, rgba(0, 0, 0, 0.18));
    background: transparent;
    font: inherit;
    padding: 0.5rem 0;
    width: 100%;
    outline: none;
    color: inherit;
  }
  input:focus {
    border-bottom-color: var(--fg, #000);
  }
  .error {
    margin: 0;
    font-size: 0.85rem;
    color: var(--accent, #e85d04);
  }
  button {
    border: 1px solid var(--fg, #000);
    background: var(--fg, #000);
    color: var(--bg, #fff);
    padding: 0.75rem 1rem;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    margin-top: 0.5rem;
  }
  button:disabled {
    opacity: 0.55;
    cursor: progress;
  }
</style>
