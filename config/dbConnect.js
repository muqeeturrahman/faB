'use strict';

const mongoose = require('mongoose');

class DB_CONNECT {
    constructor() {
        mongoose.set('strictQuery', true);
        mongoose.connect(process.env.MONGODB_URL)
            .then(() => console.log(`Connected to DB!`)) //: ${process.env.MONGODB_URL}`))
            .catch((error) => console.log("db error: ", error));
    }
}

module.exports = DB_CONNECT;