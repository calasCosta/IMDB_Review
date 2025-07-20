const { getConnection } = require("../database/config");
const { get } = require("../routes");

async function getPositiveReviewOriginalSet(){
    return await getCorpus("positive");                 
}  

async function getNegativeReviewOriginalSet(){
    return await getCorpus("negative");          
} 

async function getCorpus(sentiment, limit = 100) {
    const connection = await getConnection(); 

    try {
        const sql = `SELECT id, review as Review, sentiment FROM eai_final_project.corpus WHERE Sentiment = ? LIMIT ${limit}`;
        const [rows] = await connection.execute(sql, [sentiment]);
        return rows;
    } finally {
        await connection.end(); 
    }
}

async function insertCorpus(review, sentiment) {
    const connection = await getConnection(); 

    try {
        const sql = `INSERT INTO corpus (Review, Sentiment) VALUES (?, ?)`;
        const [result] = await connection.execute(sql, [review, sentiment]);
        return result;
    } finally {
        await connection.end(); 
    }
}

async function getTotalRows(){
    const connection = await getConnection(); 

    try {
        const sql = `SELECT COUNT(*) as total FROM eai_final_project.corpus`;
        const [rows] = await connection.execute(sql);
        return rows[0].total;
    } finally {
        await connection.end(); 
    }
}

async function getClassCount(sentiment) {
    const connection = await getConnection(); 

    try {
        const sql = `SELECT COUNT(*) as total FROM eai_final_project.corpus WHERE Sentiment = ?`;
        const [rows] = await connection.execute(sql, [sentiment]);   
        return rows[0].total; 
    } finally {
        await connection.end(); 
    }
}

module.exports = {
    getPositiveReviewOriginalSet,
    getNegativeReviewOriginalSet,
    getCorpus,
    getTotalRows,
    getClassCount,
    insertCorpus
};