import { uniqueNamesGenerator, Config, adjectives, animals, names } from 'unique-names-generator';

const casinoAdjectives = ['Lucky', 'Golden', 'Royal', 'Grand', 'Diamond', 'Silver', 'Ace', 'Highroll', 'Vegas', 'Jackpot'];
const casinoNouns = ['Striker', 'King', 'Queen', 'Joker', 'Ace', 'Dealer', 'Winner', 'Player', 'Gambler', 'Fortune'];

const shortNameConfig: Config = {
  dictionaries: [adjectives, animals],
  separator: '',
  style: 'capital',
  length: 2,
};

const fullNameConfig: Config = {
  dictionaries: [names, names], // First name, Last name
  separator: ' ',
  length: 2,
}

const casinoNameConfig: Config = {
  dictionaries: [casinoAdjectives, casinoNouns],
  separator: ' ',
  length: 2,
}

export function generateRandomName(type: 'short' | 'full' | 'casino' = 'full'): string {
  switch (type) {
    case 'short':
      return uniqueNamesGenerator(shortNameConfig);
    case 'casino':
      return uniqueNamesGenerator(casinoNameConfig);
    case 'full':
    default:
      return uniqueNamesGenerator(fullNameConfig);
  }
}

// Voorbeelden:
// console.log(generateRandomName('short')); // Bijv. "RedLion"
// console.log(generateRandomName('full'));  // Bijv. "John Doe"
// console.log(generateRandomName('casino')); // Bijv. "Lucky Striker" 