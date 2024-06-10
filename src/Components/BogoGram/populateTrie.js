import Trie from './Trie';

// Split the contents by newline characters to get an array of words

// Initialize the trie
const dictionary = new Trie();

// Insert each word into the trie
wordsArray.forEach(word => dictionary.insert(word.trim()));

export default dictionary;