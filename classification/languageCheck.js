const natural = require('natural');
const { WordTokenizer, SentenceTokenizer } = natural;

// Initialize tokenizers
const wordTokenizer = new WordTokenizer();
const sentenceTokenizer = new SentenceTokenizer();

// Enhanced dictionary with common words
const DICTIONARY = new Set([
  // Basic English words
  'a', 'about', 'all', 'also', 'and', 'are', 'as', 'at', 'be', 'been', 
  'being', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'don\'t', 
  'even', 'for', 'from', 'get', 'go', 'has', 'have', 'he', 'her', 'his', 
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'like', 
  'look', 'make', 'many', 'me', 'more', 'most', 'movie', 'movies', 'my', 
  'no', 'not', 'now', 'of', 'on', 'one', 'only', 'or', 'other', 'our', 
  'out', 'over', 'people', 'say', 'see', 'she', 'so', 'some', 'such', 
  'take', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 
  'they', 'this', 'those', 'time', 'to', 'two', 'up', 'use', 'very', 'was', 
  'way', 'we', 'well', 'what', 'when', 'which', 'who', 'will', 'with', 'love',
  'would', 'you', 'your'
  // Add more words as needed
]);

/**
 * Get context around a word in text
 */
function getWordContext(text, word, index, windowSize = 10) {
  if (!text || !word) return '';
  const wordPos = text.toLowerCase().indexOf(word.toLowerCase());
  return wordPos >= 0 
    ? text.substring(
        Math.max(0, wordPos - windowSize),
        Math.min(text.length, wordPos + word.length + windowSize)
      )
    : word;
}

// Add this new function to detect nonsense words
function isNonsense(word) {
  if (word.length < 4) return false; // Skip short words
  const vowels = word.match(/[aeiouy]/gi);
  const consonantClusters = word.match(/[bcdfghjklmnpqrstvwxz]{3,}/gi);
  
  // Words without vowels or with excessive consonants are likely nonsense
  return (!vowels || vowels.length < word.length/4 || 
         (consonantClusters && consonantClusters.length > 1));
}

/**
 * Check if word should be skipped
 */
function shouldSkipWord(word) {
  if (!word || word.length < 2) return true;
  const lowerWord = word.toLowerCase();
  return (
    /[0-9]/.test(lowerWord) ||
    lowerWord.startsWith('http') ||
    lowerWord.includes('@') ||
    lowerWord.includes('.com') ||
    lowerWord.startsWith('#')
  );
}

/**
 * Enhanced spelling check
 */
function checkSpelling(text) {
  if (!text || typeof text !== 'string') return [];
  
  const words = wordTokenizer.tokenize(text.toLowerCase()) || [];
  return words.reduce((errors, word, index) => {
    if (shouldSkipWord(word)) return errors;

    // Remove surrounding punctuation
    const cleanWord = word.replace(/^[^a-z]+|[^a-z]+$/gi, '');
    if (!cleanWord) return errors;

    // Check dictionary with case insensitivity
    const lowerWord = cleanWord.toLowerCase();
    if (DICTIONARY.has(lowerWord)) return errors;

    // Check for common suffixes
    const baseWord = lowerWord.replace(/(ing|ed|s|es)$/, '');
    if (DICTIONARY.has(baseWord)) return errors;

    // Only flag words that are clearly misspelled
    if (lowerWord.length > 3 && !lowerWord.includes("'")) {
      errors.push({
        word: word,
        position: index + 1,
        context: getWordContext(text, word, index)
      });
    }
    return errors;
  }, []);
}

// Enhanced grammar check
function checkGrammar(text) {
  if (!text || typeof text !== 'string') return [];
  
  const sentences = sentenceTokenizer.tokenize(text) || [];
  return sentences.reduce((errors, sentence, sentenceIndex) => {
    const words = wordTokenizer.tokenize(sentence.toLowerCase()) || [];
    
    // Check for nonsense words
    const nonsenseWords = words.filter(w => isNonsense(w));
    if (nonsenseWords.length > 0) {
      errors.push({
        type: 'nonsense',
        message: `Contains nonsense words: ${nonsenseWords.join(', ')}`,
        sentence: sentence,
        position: sentenceIndex + 1
      });
    }

    // Check basic sentence structure
    if (words.length > 3) {
      const hasVerb = words.some(w => ['is','are','was','were','do','does'].includes(w));
      const hasNoun = words.some(w => DICTIONARY.has(w) && w.length > 3);
      
      if (!hasVerb || !hasNoun) {
        errors.push({
          type: 'structure',
          message: 'Sentence lacks proper structure',
          sentence: sentence,
          position: sentenceIndex + 1
        });
      }
    }

    return errors;
  }, []);
}
/**
 * Calculate quality score (0-100)
 */
function calculateQualityScore(spellingErrors, grammarErrors) {
  const maxSpellingPenalty = Math.min(spellingErrors * 2, 20);
  const maxGrammarPenalty = Math.min(grammarErrors * 3, 15);
  return Math.max(50, 100 - maxSpellingPenalty - maxGrammarPenalty);
}

/**
 * Main validation function
 */
async function validateText(text) {
  const defaultResponse = {
    isValid: false,
    spellingErrors: [],
    grammarErrors: [],
    score: 0
  };

  if (typeof text !== 'string' || text.trim().length === 0) {
    return {
      ...defaultResponse,
      grammarErrors: [{ type: 'invalid_input', message: 'Empty or invalid text' }]
    };
  }

  try {
    const [spellingErrors, grammarErrors] = await Promise.all([
      Promise.resolve(checkSpelling(text)),
      Promise.resolve(checkGrammar(text))
    ]);

    return {
      isValid: spellingErrors.length === 0 && grammarErrors.length === 0,
      spellingErrors,
      grammarErrors,
      score: calculateQualityScore(spellingErrors.length, grammarErrors.length)
    };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      ...defaultResponse,
      grammarErrors: [{ type: 'validation_error', message: error.message }]
    };
  }
}

module.exports = { validateText };