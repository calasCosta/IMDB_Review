// database/statsResults.js
const { getConnection } = require('./config');

async function saveStatsResult(statsData) {
    try{
        const connection = await getConnection();

        const sql = `INSERT INTO stats_results (
            trained_models_id, limit_size, true_labels, predicted_labels, matrix, metrics
            ) VALUES (?, ?, ?, ?, ?, ?)`;

        let trainedModelId = await getTrainedModelId("bayes_ngram", statsData.limit);
        if (trainedModelId === 0) {
            throw new Error('No trained model found for the given model and limit');
        }

        const values = [
            trainedModelId,
            statsData.limit,
            JSON.stringify(statsData.trueLabels),
            JSON.stringify(statsData.predictedLabels),
            JSON.stringify(statsData.matrix),
            JSON.stringify(statsData.metrics)
        ];

        await connection.execute(sql, values);
        await connection.end();
    } catch (error) {
        console.error('Error saving stats result:', error);
        throw new Error('Error saving stats result');
    }
}

async function getTrainedModelId(modelName, limit) {
    const connection = await getConnection();
    try {
        const sql = `SELECT id FROM trained_models WHERE model_name = ? AND _limit = ?`;
        const [rows] = await connection.execute(sql, [modelName, limit]);
        return rows.length > 0 ? rows[0].id : 0;
    } finally {
        await connection.end();
    }
}   

async function getStatsResults(limit) {
    try{
        const connection = await getConnection(); 
        const sql = `SELECT * FROM stats_results
            WHERE limit_size = ?`;
        const [rows] = await connection.execute(sql, [limit]);

        await connection.end();
        return rows;
    } catch (error) {
        console.error('Error fetching stats:', error);
        throw new Error('Error fetching stats results');
    }
}


module.exports = { saveStatsResult, getStatsResults };
