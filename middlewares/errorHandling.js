'use strict';

const { Schema, model } = require("mongoose");

const logSchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    body: { type: String },
    message: String,
    stack: String,
});

const LogModel = model('log', logSchema);

class ErrorHandling {
    static notFound(req, res, next) {
        const error = new Error(`Not Found - ${req.originalUrl}`);
        res.status(404);
        next(error);
    }

    static async errorHandler(err, req, res, next) {
        // console.log("req.body", req.body);
        const statusCode = err?.statusCode ? err?.statusCode : 500;
        const error = new Error(err?.message || 'Internal Server Error');

        // Create a new log document
        const log = new LogModel({
            body: JSON.stringify(req.body),
            message: error?.message,
            stack: error?.stack,
        });

        // Save the log document
        try {
            await log.save();
        }
        catch (err) {
            console.error('Error saving log:', error);
        }

        return res.status(statusCode).json({
            status: false,
            message: error?.message,
            data: err?.data || {},
        });
    }
}

module.exports = ErrorHandling;