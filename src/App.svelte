<script>
  import Page from './routes/+page.svelte';
</script>

<Page />

<style>
  @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Roboto+Mono:wght@400;700&display=swap');

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Roboto Mono', monospace;
    background-color: #1a1a2e;
    background-image: 
      radial-gradient(rgba(25, 25, 46, 0.7) 2px, transparent 2px),
      radial-gradient(rgba(25, 25, 46, 0.5) 1px, transparent 1px);
    background-size: 40px 40px, 20px 20px;
    background-position: 0 0, 20px 20px;
    color: #e6e6e6;
    position: relative;
    min-height: 100vh;
  }

  :global(body::before) {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='rgba(255,255,255,0.03)' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.5;
    z-index: -1;
  }

  :global(h1, h2, h3) {
    font-family: 'Special Elite', cursive;
    letter-spacing: 1px;
  }

  :global(.top-secret) {
    position: fixed;
    top: 10px;
    right: 10px;
    font-family: 'Special Elite', cursive;
    color: #e63946;
    border: 2px solid #e63946;
    padding: 5px 10px;
    transform: rotate(5deg);
    font-size: 14px;
    opacity: 0.8;
    z-index: 100;
  }

  :global(.top-secret::before) {
    content: "TOP SECRET";
  }

  :global(.classified-stamp) {
    position: fixed;
    bottom: 20px;
    left: 20px;
    font-family: 'Special Elite', cursive;
    color: rgba(230, 57, 70, 0.7);
    border: 2px solid rgba(230, 57, 70, 0.7);
    border-radius: 5px;
    padding: 5px 10px;
    transform: rotate(-15deg);
    font-size: 16px;
    z-index: 100;
  }

  :global(.classified-stamp::before) {
    content: "CLASSIFIED";
  }
</style>
