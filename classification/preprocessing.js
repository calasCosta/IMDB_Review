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
    return text
        .replace(/\b(do not|don't|doesn't|didn't|never|not|isn't|wasn't|aren't|weren't|can't|couldn't|shouldn't|won't|wouldn't|hasn't|haven't|hadn't|n't)\s+(\w+)/gi, 'not_$2')
        .replace(/\b(no|none|nothing|nowhere|neither|nobody|nor)\b\s*(\w+)?/gi, (match, p1, p2) => {
            if (p2) return `not_${p2}`;
            return `not_${p1}`;
        });
}

async function preprocessText(text, nValues = [1], customStopwords = []) {
    // Step 1: Clean text
    const cleanedText = cleanText(text);

    // Step 2: Handle negations forte
    const negHandled = handleNegations(cleanedText);

    // Step 3: Remove stopwords (custom ou general)
    let tokensWithoutStopwords;
    if (customStopwords.length > 0) {
        tokensWithoutStopwords = removeCustomStopwords(negHandled, customStopwords);
    } else {
        tokensWithoutStopwords = removeGeneralStopwords(negHandled);
    }

    // Step 4: Apply stemming
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
