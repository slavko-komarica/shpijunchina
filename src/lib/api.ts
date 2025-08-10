/**
 * API module for the Spy Game
 * Currently uses hardcoded words, but could be extended to fetch from an external API or LLM
 */

// Hardcoded list of words
const words = [
  'airplane', 'elephant', 'computer', 'bicycle', 'mountain',
  'umbrella', 'restaurant', 'telescope', 'keyboard', 'waterfall',
  'hospital', 'chocolate', 'butterfly', 'dinosaur', 'skyscraper',
  'submarine', 'orchestra', 'lighthouse', 'sunflower', 'astronaut'
];

/**
 * Get a random word from the hardcoded list
 * @returns {string} A random word
 */
export function getRandomWord(): string {
  return words[Math.floor(Math.random() * words.length)];
}

