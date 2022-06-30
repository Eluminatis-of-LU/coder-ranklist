const mongoose = require('mongoose');
const logger = require('./../logger');
const connectionString = process.env.MONGODB_URI;

mongoose.connection.on('error', err => {
    logger.error(err);
});

module.exports = mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(res => {
        
    })
    .catch(err => {
        logger.error(err);
    });
