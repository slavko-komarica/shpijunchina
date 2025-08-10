/**
 * API module for the Spy Game
 * Uses words from a CSV file organized by categories
 */

// Type definitions
type WordCategory = {
  name: string;
  words: string[];
};

type CategoryMap = {
  [category: string]: string[];
};

// State variables
let categories: WordCategory[] = [];
let allWords: CategoryMap = {};
let selectedCategories: string[] = [];
let wordsByCategory: CategoryMap = {};

// Track words that have been used in the current session (per category)
const usedWordsByCategory: { [category: string]: Set<string> } = {};

/**
 * Initialize the word categories by loading from CSV
 * @returns {Promise<void>}
 */
export async function initializeWords(): Promise<void> {
  try {
    const response = await fetch('/words.csv');
    const csvText = await response.text();
    
    // Parse CSV
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const header = lines[0].split(',');
    
    // Skip header row
    const data = lines.slice(1);
    
    // Group words by category
    const categoryMap: CategoryMap = {};
    
    data.forEach(line => {
      const [category, word] = line.split(',');
      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(word);
    });
    
    // Convert to array of categories
    categories = Object.keys(categoryMap).map(name => ({
      name,
      words: categoryMap[name]
    }));
    
    // Store all words
    allWords = categoryMap;
    
    // Initialize with all categories selected
    selectedCategories = Object.keys(categoryMap);
    updateWordsByCategory();
    
    // Initialize used words tracking for each category
    selectedCategories.forEach(category => {
      usedWordsByCategory[category] = new Set<string>();
    });
    
  } catch (error) {
    console.error('Failed to load words:', error);
    // Fallback to some default words if loading fails
    categories = [
      { 
        name: 'default', 
        words: ['computer', 'elephant', 'bicycle', 'mountain', 'umbrella'] 
      }
    ];
    allWords = { default: categories[0].words };
    selectedCategories = ['default'];
    usedWordsByCategory['default'] = new Set<string>();
    updateWordsByCategory();
  }
}

/**
 * Update the words by category based on selected categories
 */
function updateWordsByCategory(): void {
  wordsByCategory = {};
  selectedCategories.forEach(category => {
    if (allWords[category]) {
      wordsByCategory[category] = allWords[category];
    }
  });
}

/**
 * Set the selected categories
 * @param {string[]} categories - Array of category names
 */
export function setSelectedCategories(categories: string[]): void {
  selectedCategories = categories;
  updateWordsByCategory();
}

/**
 * Get all available categories
 * @returns {WordCategory[]} Array of category objects
 */
export function getCategories(): WordCategory[] {
  return categories;
}

/**
 * Get the currently selected categories
 * @returns {string[]} Array of selected category names
 */
export function getSelectedCategories(): string[] {
  return selectedCategories;
}

/**
 * Get a random word from the selected categories that hasn't been used in this session
 * @returns {string | null} A random unused word, or null if all words have been used
 */
export function getRandomWord(): string | null {
  // Check if we have any categories selected
  if (selectedCategories.length === 0) {
    return null;
  }
  
  // Get all available words from selected categories that haven't been used
  const availableCategoriesWithWords = selectedCategories.filter(category => {
    const categoryWords = wordsByCategory[category] || [];
    const usedWords = usedWordsByCategory[category] || new Set<string>();
    return usedWords.size < categoryWords.length;
  });
  
  // If no categories have available words, return null
  if (availableCategoriesWithWords.length === 0) {
    return null;
  }
  
  // Pick a random category from those that have available words
  const randomCategory = availableCategoriesWithWords[
    Math.floor(Math.random() * availableCategoriesWithWords.length)
  ];
  
  // Get available words from this category
  const categoryWords = wordsByCategory[randomCategory] || [];
  const usedWords = usedWordsByCategory[randomCategory] || new Set<string>();
  const availableWords = categoryWords.filter(word => !usedWords.has(word));
  
  // Pick a random word
  const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
  
  // Mark as used
  usedWords.add(randomWord);
  
  return randomWord;
}

/**
 * Check if all words in the selected categories have been used
 * @returns {boolean} True if all words in selected categories have been used
 */
export function allWordsUsed(): boolean {
  if (selectedCategories.length === 0) {
    return true;
  }
  
  // Check if all words in all selected categories have been used
  return selectedCategories.every(category => {
    const categoryWords = wordsByCategory[category] || [];
    const usedWords = usedWordsByCategory[category] || new Set<string>();
    return usedWords.size >= categoryWords.length;
  });
}

/**
 * Get the total number of words available in selected categories
 * @returns {number} Total number of words
 */
export function getTotalWordCount(): number {
  return selectedCategories.reduce((total, category) => {
    return total + (wordsByCategory[category]?.length || 0);
  }, 0);
}

/**
 * Get the number of words that have been used in selected categories
 * @returns {number} Number of used words
 */
export function getUsedWordCount(): number {
  return selectedCategories.reduce((total, category) => {
    return total + (usedWordsByCategory[category]?.size || 0);
  }, 0);
}

/**
 * Get word usage statistics for each selected category
 * @returns {Object} Object with category names as keys and usage stats as values
 */
export function getCategoryStats(): { [category: string]: { used: number, total: number } } {
  const stats: { [category: string]: { used: number, total: number } } = {};
  
  selectedCategories.forEach(category => {
    const total = wordsByCategory[category]?.length || 0;
    const used = usedWordsByCategory[category]?.size || 0;
    stats[category] = { used, total };
  });
  
  return stats;
}

