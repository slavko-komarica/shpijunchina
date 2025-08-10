<script>
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import { 
    getRandomWord, 
    allWordsUsed, 
    getTotalWordCount, 
    getUsedWordCount,
    initializeWords,
    getCategories,
    getSelectedCategories,
    setSelectedCategories,
    getCategoryStats
  } from '../lib/api';

  /* —— 1. Lobby state —— */
  let playerNames = ['Alice', 'Bob', 'Charlie'];  // editable in UI
  let spyCount = 1;                             // 1-3
  const stage = writable('lobby');

  // For the reveal process
  let revealState = 'waiting'; // 'waiting' or 'revealed'

  /* —— 2. Game state —— */
  const assignments = writable({});
  const secretWord = writable('');
  const noMoreWords = writable(false);
  
  /* —— Category state —— */
  let categories = [];
  let selectedCategories = [];
  let categoryStats = {};
  let isLoading = true;
  
  // Initialize words when component mounts
  onMount(async () => {
    await initializeWords();
    categories = getCategories();
    selectedCategories = getSelectedCategories();
    updateCategoryStats();
    isLoading = false;
  });
  
  // Update category statistics
  function updateCategoryStats() {
    categoryStats = getCategoryStats();
  }
  
  // Toggle category selection
  function toggleCategory(categoryName) {
    if (selectedCategories.includes(categoryName)) {
      // Remove category if it's already selected
      selectedCategories = selectedCategories.filter(c => c !== categoryName);
    } else {
      // Add category if it's not selected
      selectedCategories = [...selectedCategories, categoryName];
    }
    
    // Update the API with the new selection
    setSelectedCategories(selectedCategories);
    updateCategoryStats();
  }
  
  // Select all categories
  function selectAllCategories() {
    selectedCategories = categories.map(c => c.name);
    setSelectedCategories(selectedCategories);
    updateCategoryStats();
  }
  
  // Deselect all categories
  function deselectAllCategories() {
    selectedCategories = [];
    setSelectedCategories(selectedCategories);
    updateCategoryStats();
  }

  // Calculate max spies (1/3 of total players, rounded down)
  $: maxSpies = Math.max(1, Math.floor(playerNames.length / 3));

  // Ensure spyCount doesn't exceed maxSpies
  $: if (spyCount > maxSpies) {
    spyCount = maxSpies;
  }

  function startGame() {
    /* get a random word from our API */
    const word = getRandomWord();
    
    // Check if we've run out of words
    if (word === null) {
      noMoreWords.set(true);
      return;
    }
    
    secretWord.set(word);

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
  
  /* —— 4. Reset game —— */
  function resetGame() {
    // Reset game state but keep player configuration
    stage.set('lobby');
    revealState = 'waiting';
    current = 0;
    secretWord.set('');
    assignments.set({});
    updateCategoryStats();
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
  <h1>Špijunčina</h1>

  {#if $stage === 'lobby'}
    <div class="lobby">
      <h2 class="pass-device">Setup Game</h2>

      {#if isLoading}
        <div class="loading">
          <p>Loading word categories...</p>
        </div>
      {:else}
        {#if $noMoreWords}
          <div class="no-more-words">
            <p>You've used all available words in the selected categories!</p>
            <p>Select different categories or refresh the page to start a new session.</p>
          </div>
        {:else}
          <div class="word-stats">
            <p>Words used: {getUsedWordCount()} / {getTotalWordCount()}</p>
          </div>
        {/if}

        <!-- Category Selection -->
        <div class="category-selection">
          <h3>Word Categories</h3>
          <div class="category-actions">
            <button on:click={selectAllCategories} class="category-button">Select All</button>
            <button on:click={deselectAllCategories} class="category-button">Deselect All</button>
          </div>
          
          <div class="categories-grid">
            {#each categories as category}
              <div class="category-item">
                <label class="category-label">
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(category.name)} 
                    on:change={() => toggleCategory(category.name)}
                  />
                  <span class="category-name">{category.name}</span>
                  {#if categoryStats[category.name]}
                    <span class="category-stat">
                      ({categoryStats[category.name].used}/{categoryStats[category.name].total})
                    </span>
                  {/if}
                </label>
              </div>
            {/each}
          </div>
          
          {#if selectedCategories.length === 0}
            <div class="warning">
              <p>Please select at least one category to play.</p>
            </div>
          {/if}
        </div>

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

        <button 
          class="start-button" 
          on:click={startGame} 
          disabled={
            playerNames.length < 3 || 
            playerNames.some(name => !name.trim()) || 
            $noMoreWords || 
            selectedCategories.length === 0
          }
        >
          Start Game
        </button>
      {/if}
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
      
      {#if allWordsUsed()}
        <div class="no-more-words">
          <p>You've used all available words in the selected categories!</p>
          <p>Return to the lobby to select different categories or refresh the page to start a new session.</p>
        </div>
        <button on:click={resetGame}>Return to Lobby</button>
      {:else}
        <div class="word-stats">
          <p>Words used: {getUsedWordCount()} / {getTotalWordCount()}</p>
          
          <!-- Category Statistics -->
          <div class="category-stats">
            <h3>Category Statistics</h3>
            <div class="category-stats-grid">
              {#each Object.entries(categoryStats) as [category, stats]}
                {#if selectedCategories.includes(category)}
                  <div class="category-stat-item">
                    <span class="category-name">{category}</span>
                    <span class="category-usage">{stats.used}/{stats.total} used</span>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        </div>
        <button on:click={resetGame}>Play Again</button>
      {/if}
    </div>
  {/if}
</main>

<style>
  main {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 10px;
    font-family: Arial, sans-serif;
    box-sizing: border-box;
  }

  h1 {
    font-size: 1.8em;
    text-align: center;
    color: #333;
    margin-bottom: 15px;
  }

  h2 {
    font-size: 1.4em;
    text-align: center;
    color: #333;
  }

  .lobby, .reveal, .done {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .player-list, .spy-count {
    border: 1px solid #ddd;
    padding: 12px;
    border-radius: 5px;
    background-color: #fff;
  }

  .player-input {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .player-input button {
    align-self: flex-end;
    width: 100%;
  }

  input[type="text"] {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px; /* Better for touch */
    box-sizing: border-box;
  }

  input[type="range"] {
    width: 100%;
    margin: 10px 0;
  }

  button {
    padding: 12px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px; /* Better for touch */
    min-height: 44px; /* Minimum touch target size */
  }

  button:hover {
    background-color: #45a049;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .start-button {
    font-size: 1.1em;
    padding: 14px;
    width: 100%;
  }

  .card {
    border: 1px solid #ddd;
    padding: 15px;
    border-radius: 5px;
    text-align: center;
    margin: 15px 0;
    background-color: #fff;
  }

  .word {
    font-size: 1.3em;
    color: #333;
  }

  .spy {
    font-size: 1.3em;
    color: #ff0000;
    font-weight: bold;
  }

  .spy-count-text {
    color: #333;
    font-weight: bold;
    display: block;
    margin-top: 8px;
    text-align: center;
  }

  .instruction {
    font-size: 1.1em;
    color: #333;
    margin-bottom: 15px;
  }

  .reveal-button {
    font-size: 1.1em;
    padding: 14px;
    background-color: #2196F3;
    width: 100%;
  }

  .reveal-button:hover {
    background-color: #0b7dda;
  }

  .pass-device {
    background-color: #fff;
    padding: 12px;
    border-radius: 5px;
    border: 1px solid #ddd;
    margin-bottom: 10px;
    color: #333;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .game-info {
    background-color: #fff;
    padding: 12px;
    border-radius: 5px;
    border: 1px solid #ddd;
    margin-bottom: 10px;
    color: #333;
    text-align: center;
    font-size: 1.1em;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .no-more-words {
    background-color: #fff8e1;
    padding: 12px;
    border-radius: 5px;
    border: 1px solid #ffecb3;
    margin-bottom: 15px;
    color: #ff6f00;
    text-align: center;
    font-size: 1.1em;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .no-more-words p {
    margin: 5px 0;
  }
  
  .word-stats {
    background-color: #e8f5e9;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #c8e6c9;
    margin-bottom: 15px;
    color: #2e7d32;
    text-align: center;
    font-size: 1em;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .word-stats p {
    margin: 5px 0;
    font-weight: bold;
  }
  
  /* Category Selection Styles */
  .category-selection {
    border: 1px solid #ddd;
    padding: 12px;
    border-radius: 5px;
    background-color: #fff;
    margin-bottom: 15px;
  }
  
  .category-selection h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #2e7d32;
    text-align: center;
  }
  
  .category-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .category-button {
    flex: 1;
    padding: 8px;
    font-size: 0.9em;
  }
  
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  
  .category-item {
    padding: 8px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background-color: #f9f9f9;
  }
  
  .category-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .category-name {
    font-weight: 700;
    text-transform: capitalize;
    font-size: 1.1em;
    color: #2e7d32;
    display: inline-block;
    padding: 2px 0;
  }
  
  .category-stat {
    font-size: 0.8em;
    color: #666;
    margin-left: auto;
  }
  
  .warning {
    background-color: #fff3cd;
    color: #856404;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
    text-align: center;
  }
  
  .loading {
    text-align: center;
    padding: 20px;
    color: #666;
  }
  
  /* Category Statistics Styles */
  .category-stats {
    margin-top: 15px;
    padding: 10px;
    border: 1px solid #c8e6c9;
    border-radius: 5px;
    background-color: #f1f8e9;
  }
  
  .category-stats h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #2e7d32;
    text-align: center;
  }
  
  .category-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  
  .category-stat-item {
    display: flex;
    flex-direction: column;
    padding: 8px;
    border: 1px solid #c8e6c9;
    border-radius: 4px;
    background-color: #e8f5e9;
  }

  /* Ensure category names have proper contrast in the statistics section */
  .category-stat-item .category-name {
    color: #1b5e20; /* Darker green for better contrast on light green background */
  }
  
  .category-usage {
    font-size: 0.9em;
    color: #2e7d32;
    margin-top: 4px;
  }

  /* Tablet and larger */
  @media (min-width: 768px) {
    main {
      max-width: 90%;
      padding: 15px;
    }

    h1 {
      font-size: 2.2em;
    }

    h2 {
      font-size: 1.6em;
    }

    .player-input {
      flex-direction: row;
      align-items: center;
    }

    .player-input button {
      width: auto;
    }

    .start-button {
      width: auto;
      margin: 0 auto;
      display: block;
      min-width: 200px;
    }

    .reveal-button {
      width: auto;
      margin: 0 auto;
      display: block;
      min-width: 200px;
    }

    .word {
      font-size: 1.4em;
    }

    .spy {
      font-size: 1.4em;
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    main {
      max-width: 800px;
      padding: 20px;
    }

    h1 {
      font-size: 2.5em;
    }

    h2 {
      font-size: 1.8em;
    }

    .card {
      padding: 20px;
    }

    .word {
      font-size: 1.5em;
    }

    .spy {
      font-size: 1.5em;
    }
  }
</style>
