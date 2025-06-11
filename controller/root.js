'use strict';

const { generateResponse } = require('../utils');

exports.DefaultHandler = (req, res, next) => {
    generateResponse({}, 'Welcome to the API', res);
};