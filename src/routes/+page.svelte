<script>
  import { writable } from 'svelte/store';
  import { getRandomWord } from '../lib/api';

  /* —— 1. Lobby state —— */
  let playerNames = ['Alice', 'Bob', 'Charlie'];  // editable in UI
  let spyCount = 1;                             // 1-3
  const stage = writable('lobby');

  // For the reveal process
  let revealState = 'waiting'; // 'waiting' or 'revealed'

  /* —— 2. Game state —— */
  const assignments = writable({});
  const secretWord = writable('');

  // Calculate max spies (1/3 of total players, rounded down)
  $: maxSpies = Math.max(1, Math.floor(playerNames.length / 3));

  // Ensure spyCount doesn't exceed maxSpies
  $: if (spyCount > maxSpies) {
    spyCount = maxSpies;
  }

  function startGame() {
    /* get a random word from our API */
    secretWord.set(getRandomWord());

    /* randomly pick spies */
    const shuffled = [...playerNames].sort(() => Math.random() - 0.5);
    const spies = new Set(shuffled.slice(0, spyCount));
    assignments.set(Object.fromEntries(
      playerNames.map(p => [p, spies.has(p) ? 'spy' : 'agent'])
    ));
    stage.set('reveal');
    current = 0;
    revealState = 'waiting';
  }

  /* —— 3. Reveal flow —— */
  let current = 0;

  function showRole() {
    revealState = 'revealed';
  }

  function nextPlayer() {
    if (++current >= playerNames.length) {
      stage.set('done');
    } else {
      revealState = 'waiting';
    }
  }

  // Function to add a new player
  function addPlayer() {
    playerNames = [...playerNames, ''];
  }

  // Function to remove a player
  function removePlayer(index) {
    playerNames = playerNames.filter((_, i) => i !== index);
  }

  // Function to update player name
  function updatePlayerName(index, name) {
    playerNames[index] = name;
    playerNames = [...playerNames]; // trigger reactivity
  }
</script>

<main>
  <h1>Shpijunchina</h1>

  {#if $stage === 'lobby'}
    <div class="lobby">
      <h2 class="pass-device">Setup Game</h2>

      <div class="player-list">
        <h3>Players</h3>
        {#each playerNames as name, i}
          <div class="player-input">
            <input 
              type="text" 
              bind:value={name} 
              on:input={() => updatePlayerName(i, name)}
              placeholder="Player name"
            />
            <button on:click={() => removePlayer(i)}>Remove</button>
          </div>
        {/each}
        <button on:click={addPlayer}>Add Player</button>
      </div>

      <div class="spy-count">
        <h3>Number of Spies</h3>
        <input 
          type="range" 
          min="1" 
          max={maxSpies} 
          bind:value={spyCount}
        />
        <span class="spy-count-text">{spyCount} {spyCount === 1 ? 'spy' : 'spies'} (max: {maxSpies})</span>
      </div>

      <button class="start-button" on:click={startGame} disabled={playerNames.length < 3 || playerNames.some(name => !name.trim())}>
        Start Game
      </button>
    </div>
  {:else if $stage === 'reveal'}
    <div class="reveal">
      <h2 class="pass-device">Pass the device to {playerNames[current]}</h2>

      <div class="card">
        <h3>{playerNames[current]}</h3>

        {#if revealState === 'waiting'}
          <p class="instruction">Tap the button below to see your role</p>
          <button class="reveal-button" on:click={showRole}>Reveal My Role</button>
        {:else}
          {#if $assignments[playerNames[current]] === 'agent'}
            <p class="word">The word is: <strong>{$secretWord}</strong></p>
          {:else}
            <p class="spy">You are the SPY 🤫</p>
          {/if}
          <button on:click={nextPlayer}>Next Player</button>
        {/if}
      </div>
    </div>
  {:else}
    <div class="done">
      <h2 class="pass-device">All set — start guessing!</h2>
      <p class="game-info">All players have seen their roles. The spies need to figure out the secret word!</p>
      <button on:click={() => location.reload()}>Play Again</button>
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  }

  h1, h2 {
    text-align: center;
    color: #333;
  }

  .lobby, .reveal, .done {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .player-list, .spy-count {
    border: 1px solid #ddd;
    padding: 15px;
    border-radius: 5px;
    background-color: #fff;
  }

  .player-input {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  input[type="text"] {
    flex: 1;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background-color: #45a049;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .start-button {
    font-size: 1.2em;
    padding: 12px;
  }

  .card {
    border: 1px solid #ddd;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
    margin: 20px 0;
    background-color: #fff;
  }

  .word {
    font-size: 1.5em;
    color: #333;
  }

  .spy {
    font-size: 1.5em;
    color: #ff0000;
    font-weight: bold;
  }

  .spy-count-text {
    color: #333;
    font-weight: bold;
    display: block;
    margin-top: 8px;
  }

  .instruction {
    font-size: 1.2em;
    color: #333;
    margin-bottom: 20px;
  }

  .reveal-button {
    font-size: 1.2em;
    padding: 12px 24px;
    background-color: #2196F3;
  }

  .reveal-button:hover {
    background-color: #0b7dda;
  }

  .pass-device {
    background-color: #fff;
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #ddd;
    margin-bottom: 10px;
    color: #333;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .game-info {
    background-color: #fff;
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #ddd;
    margin-bottom: 10px;
    color: #333;
    text-align: center;
    font-size: 1.2em;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
</style>
