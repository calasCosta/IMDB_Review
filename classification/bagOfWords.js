function addUniqueTerms(base, newTerms) {
    const termSet = new Set(base.map(t => t.join(' ')));
    newTerms.forEach(term => {
        const termStr = term.join(' ');
        if (!termSet.has(termStr)) {
            base.push(term);
            termSet.add(termStr);
        }
    });
    return base;
}

function binaryVector(bag, docTerms) {
    const docTermSet = new Set(docTerms.map(t => t.join(' ')));
    return bag.map(term => ({
        name: term.join(' '),
        binary: docTermSet.has(term.join(' ')) ? 1 : 0
    }));
}

function numberOfOccurrencesVector(bag, docTerms) {
    return bag.map(term => {
        const termStr = term.join(' ');
        const count = docTerms.filter(t => t.join(' ') === termStr).length;
        return {
            name: termStr,
            occurrences: count
        };
    });
}

function tfVector(bag, docTerms) {
    const total = docTerms.length;
    return bag.map(term => {
        const termStr = term.join(' ');
        const count = docTerms.filter(t => t.join(' ') === termStr).length;
        return {
            name: termStr,
            tf: total === 0 ? 0 : count / total
        };
    });
}

function idfVector(bag, allDocsTerms) {
    const N = allDocsTerms.length;

    return bag.map(term => {
        const termStr = term.join(' ');
        const df = allDocsTerms.filter(doc =>
            doc.some(t => t.join(' ') === termStr)
        ).length;

        const idf = df === 0 ? 0 : Math.log10(N / df);

        return {
            name: termStr,
            idf: isFinite(idf) && !isNaN(idf) ? idf : 0
        };
    });
}

function tfidfVector(tfBag, idfList) {
    const idfMap = new Map(idfList.map(item => [item.name, item.idf]));

    return tfBag.map(item => {
        const idf = idfMap.get(item.name);

        const tfidf = (typeof item.tf === 'number' && typeof idf === 'number' && !isNaN(item.tf) && !isNaN(idf))
            ? item.tf * idf
            : 0;

        return {
            ...item,
            idf: idf ?? 0, // incluímos para debug
            tfidf
        };
    });
}



//Função do LAB 5 : SUM VECTOR
function sumVector(termArray) {
    if (termArray.length === 0) return null;
    const name = termArray[0].name;
    const idf = termArray[0].idf;

    const result = termArray.reduce((acc, term) => {
        acc.binary += term.binary || 0;
        acc.occurrences += term.occurrences || 0;
        acc.tf += term.tf || 0;
        return acc;
    }, { name, binary: 0, occurrences: 0, tf: 0 });

    result.idf = idf;
    result.tfidf = result.tf * idf;
    return result;
}

//Função do LAB 5: AVG VECTOR
function avgVector(termArray) {
    if (termArray.length === 0) return null;
    const name = termArray[0].name;
    const idf = termArray[0].idf;
    const total = termArray.length;

    const result = termArray.reduce((acc, term) => {
        acc.binary += term.binary || 0;
        acc.occurrences += term.occurrences || 0;
        acc.tf += term.tf || 0;
        return acc;
    }, { name, binary: 0, occurrences: 0, tf: 0 });

    result.binary = result.binary / total;
    result.occurrences = result.occurrences / total;
    result.tf = result.tf / total;
    result.idf = idf;
    result.tfidf = result.tf * idf;
    return result;
}

//LAB 5 : Remover termos com poucas ocorrências
function removeOutliersByMinOccurrences(termArray, min = 2) {
    return termArray.filter(term => term.occurrences >= min);
}

function normalizeTfidfVector(vector) {
    const norm = Math.sqrt(vector.reduce((sum, t) => sum + (t.tfidf || 0) ** 2, 0));
    return vector.map(t => ({
        ...t,
        tfidf: norm === 0 ? 0 : t.tfidf / norm
    }));
}

module.exports = {
    addUniqueTerms,
    binaryVector,
    numberOfOccurrencesVector,
    tfVector,
    idfVector,
    tfidfVector,
    sumVector,
    avgVector,
    removeOutliersByMinOccurrences,
    normalizeTfidfVector
};
