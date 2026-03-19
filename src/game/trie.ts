// ============================================
// Smart Scrabble - Trie Data Structure
// ============================================
// Prefix tree for O(k) word lookup and validation

interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
}

function normalizeTr(word: string): string {
  return word
    .trim()
    .toLocaleUpperCase('tr-TR');
}

export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = this.createNode();
  }

  private createNode(): TrieNode {
    return { children: new Map(), isEndOfWord: false };
  }

  /** Insert a word into the trie */
  insert(word: string): void {
    let node = this.root;
    for (const char of normalizeTr(word)) {
      if (!node.children.has(char)) {
        node.children.set(char, this.createNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
  }

  /** Check if an exact word exists in the trie */
  search(word: string): boolean {
    const node = this.traverse(normalizeTr(word));
    return node !== null && node.isEndOfWord;
  }

  /** Check if any word in the trie starts with the given prefix */
  startsWith(prefix: string): boolean {
    return this.traverse(normalizeTr(prefix)) !== null;
  }

  /** Get the node for a given prefix, or null if not found */
  private traverse(str: string): TrieNode | null {
    let node = this.root;
    for (const char of str) {
      if (!node.children.has(char)) {
        return null;
      }
      node = node.children.get(char)!;
    }
    return node;
  }

  /** Get all valid letters that can follow a prefix */
  getValidNextLetters(prefix: string): string[] {
    const node = this.traverse(normalizeTr(prefix));
    if (!node) return [];
    return Array.from(node.children.keys());
  }

  /** Check if a prefix can form a complete word with the given letter appended */
  canFormWord(prefix: string, letter: string): boolean {
    const node = this.traverse(normalizeTr(prefix));
    if (!node) return false;
    const child = node.children.get(normalizeTr(letter));
    return child !== null && child !== undefined && child.isEndOfWord;
  }

  /** Get total number of words in the trie */
  get size(): number {
    let count = 0;
    const dfs = (node: TrieNode) => {
      if (node.isEndOfWord) count++;
      for (const child of node.children.values()) {
        dfs(child);
      }
    };
    dfs(this.root);
    return count;
  }
}

// Singleton trie instance
let globalTrie: Trie | null = null;

/** Load dictionary and build trie */
export async function loadDictionary(): Promise<Trie> {
  if (globalTrie) return globalTrie;

  const response = await fetch('/dictionary.json');
  const words: string[] = await response.json();

  const trie = new Trie();
  for (const word of words) {
    const normalized = normalizeTr(word);
    if (normalized.length >= 2) {
      trie.insert(normalized);
    }
  }

  globalTrie = trie;
  return trie;
}

/** Get the global trie instance (must call loadDictionary first) */
export function getTrie(): Trie | null {
  return globalTrie;
}
