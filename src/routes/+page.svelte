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
  <div class="top-secret"></div>
  <div class="classified-stamp"></div>
  <h1>Špijunčina</h1>
  <div class="subtitle">TOP SECRET INTELLIGENCE OPERATION</div>

  {#if $stage === 'lobby'}
    <div class="lobby">
      <h2 class="pass-device setup-heading">Setup Secure Transmission</h2>

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
    padding: 15px;
    box-sizing: border-box;
    position: relative;
  }

  h1 {
    font-size: 2.2em;
    text-align: center;
    color: #e63946;
    margin-bottom: 5px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    letter-spacing: 2px;
  }

  .subtitle {
    text-align: center;
    font-size: 0.9em;
    color: #a8a8a8;
    margin-bottom: 20px;
    letter-spacing: 1px;
    font-family: 'Roboto Mono', monospace;
  }

  h2 {
    font-size: 1.4em;
    text-align: center;
    color: #e6e6e6;
  }

  h3 {
    color: #4cc9f0;
  }

  .lobby, .reveal, .done {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .player-list, .spy-count {
    border: 1px solid #2a2a4a;
    padding: 15px;
    border-radius: 5px;
    background-color: rgba(26, 26, 46, 0.7);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(5px);
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
    border: 1px solid #2a2a4a;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
    background-color: #1a1a2e;
    color: #e6e6e6;
    font-family: 'Roboto Mono', monospace;
  }

  input[type="range"] {
    width: 100%;
    margin: 10px 0;
    accent-color: #e63946;
  }

  button {
    padding: 12px 16px;
    background-color: #3a0ca3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    min-height: 44px;
    font-family: 'Roboto Mono', monospace;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }

  button:hover {
    background-color: #4361ee;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  }

  button:disabled {
    background-color: #444444;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .start-button {
    font-size: 1.1em;
    padding: 14px;
    width: 100%;
    background-color: #e63946;
  }

  .start-button:hover {
    background-color: #f25d69;
  }

  .card {
    border: 1px solid #2a2a4a;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
    margin: 15px 0;
    background-color: rgba(26, 26, 46, 0.8);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #e63946, #4361ee, #4cc9f0);
  }

  .word {
    font-size: 1.5em;
    color: #4cc9f0;
    font-weight: bold;
    text-shadow: 0 0 5px rgba(76, 201, 240, 0.3);
    letter-spacing: 1px;
  }

  .spy {
    font-size: 1.5em;
    color: #e63946;
    font-weight: bold;
    text-shadow: 0 0 5px rgba(230, 57, 70, 0.3);
    letter-spacing: 1px;
  }

  .spy-count-text {
    color: #e6e6e6;
    font-weight: bold;
    display: block;
    margin-top: 8px;
    text-align: center;
  }

  .instruction {
    font-size: 1.1em;
    color: #a8a8a8;
    margin-bottom: 15px;
  }

  .reveal-button {
    font-size: 1.1em;
    padding: 14px;
    background-color: #4361ee;
    width: 100%;
  }

  .reveal-button:hover {
    background-color: #4cc9f0;
  }

  .pass-device {
    background-color: rgba(26, 26, 46, 0.8);
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #2a2a4a;
    margin-bottom: 15px;
    color: #e6e6e6;
    font-weight: bold;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    position: relative;
  }

  .pass-device::before {
    content: "⚠ SECURE TRANSMISSION ⚠";
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #e63946;
    color: white;
    font-size: 0.7em;
    padding: 3px 8px;
    border-radius: 3px;
    font-family: 'Roboto Mono', monospace;
  }

  .game-info {
    background-color: rgba(26, 26, 46, 0.8);
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #2a2a4a;
    margin-bottom: 15px;
    color: #e6e6e6;
    text-align: center;
    font-size: 1.1em;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .no-more-words {
    background-color: rgba(51, 41, 20, 0.8);
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #5e4a23;
    margin-bottom: 15px;
    color: #ffc300;
    text-align: center;
    font-size: 1.1em;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .no-more-words p {
    margin: 5px 0;
  }
  
  .word-stats {
    background-color: rgba(20, 51, 25, 0.8);
    padding: 12px;
    border-radius: 5px;
    border: 1px solid #2a5a32;
    margin-bottom: 15px;
    color: #4cc9f0;
    text-align: center;
    font-size: 1em;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .word-stats p {
    margin: 5px 0;
    font-weight: bold;
  }
  
  /* Category Selection Styles */
  .category-selection {
    border: 1px solid #2a2a4a;
    padding: 15px;
    border-radius: 5px;
    background-color: rgba(26, 26, 46, 0.7);
    margin-bottom: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .category-selection h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #4cc9f0;
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
    padding: 10px;
    border: 1px solid #2a2a4a;
    border-radius: 4px;
    background-color: rgba(42, 42, 74, 0.5);
    transition: all 0.2s ease;
  }
  
  .category-item:hover {
    background-color: rgba(42, 42, 74, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
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
    color: #4cc9f0;
    display: inline-block;
    padding: 2px 0;
  }
  
  .category-stat {
    font-size: 0.8em;
    color: #a8a8a8;
    margin-left: auto;
  }
  
  .warning {
    background-color: rgba(51, 41, 20, 0.8);
    color: #ffc300;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
    text-align: center;
    border: 1px solid #5e4a23;
  }
  
  .loading {
    text-align: center;
    padding: 20px;
    color: #a8a8a8;
  }
  
  /* Category Statistics Styles */
  .category-stats {
    margin-top: 15px;
    padding: 12px;
    border: 1px solid #2a5a32;
    border-radius: 5px;
    background-color: rgba(20, 51, 25, 0.6);
  }
  
  .category-stats h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #4cc9f0;
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
    border: 1px solid #2a5a32;
    border-radius: 4px;
    background-color: rgba(20, 51, 25, 0.8);
  }

  /* Ensure category names have proper contrast in the statistics section */
  .category-stat-item .category-name {
    color: #4cc9f0;
  }
  
  .category-usage {
    font-size: 0.9em;
    color: #a8a8a8;
    margin-top: 4px;
  }
  
  /* Prevent duplicate "SECURE TRANSMISSION" text on the setup heading */
  .setup-heading::before {
    content: none;
  }

  /* Tablet and larger */
  @media (min-width: 768px) {
    main {
      max-width: 90%;
      padding: 20px;
    }

    h1 {
      font-size: 2.5em;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 1em;
      margin-bottom: 25px;
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
      font-size: 1.6em;
    }

    .spy {
      font-size: 1.6em;
    }
    
    .pass-device::before {
      font-size: 0.8em;
      padding: 4px 10px;
    }
    
    .categories-grid {
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    main {
      max-width: 800px;
      padding: 25px;
    }

    h1 {
      font-size: 3em;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.4);
    }

    .subtitle {
      font-size: 1.1em;
      margin-bottom: 30px;
    }

    h2 {
      font-size: 1.8em;
    }

    .card {
      padding: 25px;
      border-radius: 8px;
    }
    
    .card::before {
      height: 6px;
    }

    .word {
      font-size: 1.8em;
      text-shadow: 0 0 8px rgba(76, 201, 240, 0.4);
    }

    .spy {
      font-size: 1.8em;
      text-shadow: 0 0 8px rgba(230, 57, 70, 0.4);
    }
    
    .top-secret, .classified-stamp {
      font-size: 18px;
      padding: 8px 15px;
    }
    
    .player-list, .spy-count, .category-selection {
      padding: 20px;
      border-radius: 8px;
    }
    
    button {
      border-radius: 6px;
    }
    
    .categories-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
  }
</style>
