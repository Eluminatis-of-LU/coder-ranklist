const mongoose = require('mongoose');
const logger = require('./../logger');
const connectionString = process.env.MONGODB_URI;

mongoose.connection.on('error', err => {
    logger.error(err);
});

module.exports = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true, dbName: process.env.MONGODB_DB_NAME || 'test'})
    .then(res => {
        
    })
    .catch(err => {
        logger.error(err);
    });
