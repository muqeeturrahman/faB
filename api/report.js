'use strict';

const { Router } = require('express');
const { createReport, getAllUserReports } = require('../controller/report');
const AuthMiddleWare = require('../middlewares/AuthMiddleWare');
const { ROLES } = require('../utils/constants');
const { asyncHandler } = require('../middlewares/genericResHandler');

class ReportAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        const router = this.router;
        router.post('/create-report', AuthMiddleWare(ROLES.ORGANIZATION), asyncHandler(createReport));
        router.get('/get-user-reports', AuthMiddleWare(ROLES.ORGANIZATION), asyncHandler(getAllUserReports));
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/report';
    }
}

module.exports = ReportAPI; 