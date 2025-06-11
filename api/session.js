'use strict';

const { Router } = require('express');
const { sessionCreate,joinSession,getMySessions,getSessionDetailsById,removeUser,leavesession,Endsession,getServices
    ,startSession,getMyJoinedSessions,sendInvitation
} = require('../controller/session');
const AuthMiddleWare = require('../middlewares/AuthMiddleWare');
const { asyncHandler } = require('../middlewares/genericResHandler');

class sessionAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        const router = this.router;
        router.post('/sessionCreate', AuthMiddleWare(), asyncHandler(sessionCreate));
        router.post('/joinsession', AuthMiddleWare(), asyncHandler(joinSession));
        router.get('/getmysessions', AuthMiddleWare(), asyncHandler(getMySessions));
        router.post('/getSessionDetailsById', AuthMiddleWare(), asyncHandler(getSessionDetailsById));
        router.post('/removeUserFromSession', AuthMiddleWare(), asyncHandler(removeUser));
        router.post('/leaveUserFromSession', AuthMiddleWare(), asyncHandler(leavesession));
        router.post('/endsession', AuthMiddleWare(), asyncHandler(Endsession));
        router.post('/startsession', AuthMiddleWare(), asyncHandler(startSession));
        router.get('/myjoinedsessions', AuthMiddleWare(), asyncHandler(getMyJoinedSessions));
        router.get('/get-recommendations', AuthMiddleWare(), asyncHandler(getServices));
        router.post('/sendinvitation', AuthMiddleWare(), asyncHandler(sendInvitation));
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/session';
    }
}

module.exports = sessionAPI; 