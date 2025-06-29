/**
 * Pipeline de preprocessing:
 * - Clean text
 * - Handle strong negations (not_good)
 * - Remove stopwords (inclusive custom)
 * - Apply stemming
 * - Generate n-grams
 */

const { cleanText } = require('./clean');
const { removeGeneralStopwords, removeCustomStopwords } = require('./stopwords');
const { applyStemming } = require('./stemming');
const { generateNGrams } = require('./tokenization');

// Handle negations robusto (not good -> not_good, dont love -> not_love, isn't -> not_is)
function handleNegations(text) {
    return text.replace(/\b(do not|don't|doesn't|didn't|never|not)\s+(\w+)/gi, 'not_$2');
}

async function preprocessText(text, nValues = [1], customStopwords = []) {
    // Step 1: Handle negations forte
    const negHandled = handleNegations(text.toLowerCase());

    // Step 2: Clean text
    const cleanedText = cleanText(negHandled);

    // Step 3: Stopwords
    let tokensWithoutStopwords;
    if (customStopwords.length > 0) {
        tokensWithoutStopwords = removeCustomStopwords(cleanedText, customStopwords);
    } else {
        tokensWithoutStopwords = removeGeneralStopwords(cleanedText);
    }

    // Garante que é array para o stemming
    if (typeof tokensWithoutStopwords === 'string') {
        tokensWithoutStopwords = tokensWithoutStopwords.split(' ');
    }

    // Step 4: Stemming
    const preprocessedText = applyStemming(tokensWithoutStopwords);

    // Step 5: Generate n-grams
    const tokens = nValues.map(n => ({
        n,
        tokens: generateNGrams(preprocessedText, n) || []
    }));

    return {
        originalText: text,
        cleanedText,
        negHandled,
        preprocessedText,
        tokens
    };
}

module.exports = { preprocessText, handleNegations };
