class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}
  
class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word) {
        let node = this.root;
        for (let char of word) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.isEndOfWord = true;
    }

    search(word) {
        let node = this.root;
        for (let char of word) {
            if (!node.children[char]) {
                return false;
            }
            node = node.children[char];
        }
        return node.isEndOfWord;
    }

    startsWith(prefix) {
        let node = this.root;
        for (let char of prefix) {
            if (!node.children[char]) {
                return false;
            }
            node = node.children[char];
        }
        return true;
    }

    // Serialize the trie to JSON string
    serialize() {
        return JSON.stringify(this.root);
    }

    // Deserialize a JSON string to a trie
    static deserialize(data) {
        const trie = new Trie();
        trie.root = JSON.parse(data);
        return trie;
    }
}

export default Trie;
  