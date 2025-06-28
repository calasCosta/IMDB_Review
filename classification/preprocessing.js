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

// Handle negations robusto (not good -> not_good, dont love -> dont_love, etc)
function handleNegations(text) {
    if (typeof text !== 'string') return '';

    // padrão: negação seguida de qualquer palavra (pelo menos 1 letra)
    return text.replace(/\b(not|no|never|dont|doesnt|didnt|isnt|wasnt|shouldnt|wouldnt|couldnt|won't|can't|n't)\s+([a-z]+)/g,
        (match, neg, word) => `${neg}_${word}`);
}

async function preprocessText(text, nValues = [1], customStopwords = []) {
    // Step 1: Clean text
    const cleanedText = cleanText(text);

    // Step 2: Handle negations forte
    const negHandled = handleNegations(cleanedText);

    // Step 3: Remove stopwords
    let withoutStopwords;
    if (customStopwords.length > 0) {
        withoutStopwords = removeCustomStopwords(negHandled, customStopwords);
    } else {
        withoutStopwords = removeGeneralStopwords(negHandled);
    }

    // Step 4: Apply stemming
    const preprocessedText = applyStemming(withoutStopwords);

    // Step 5: Generate tokens
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

module.exports = { preprocessText };
