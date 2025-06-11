'use strict';

const { Router } = require('express');
const {sendMessage,getChatList,getMessages,deleteMessage,deleteMessageForEveryOne,clearChat,votePoll, getPollDetails, updatePollStatus} = require("../controller/message")
const { handleMultipartData } = require("../utils/multipart");
const AuthMiddleWare = require('../middlewares/AuthMiddleWare');
const { ROLES } = require('../utils/constants');
const { asyncHandler } = require('../middlewares/genericResHandler');

class MessageAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes () {
        const router = this.router;
        router.post('/send', AuthMiddleWare(Object.values(ROLES)), handleMultipartData.fields([{ name: 'media', maxCount: 500 }]), asyncHandler(sendMessage));
        router.get('/getChatList', AuthMiddleWare(Object.values(ROLES)), asyncHandler(getChatList));
        router.get('/getMessages', AuthMiddleWare(Object.values(ROLES)), asyncHandler(getMessages));
        router.post('/deleteMessage/:messageId', AuthMiddleWare(Object.values(ROLES)), asyncHandler(deleteMessage));
        router.put('/deleteMessageForEveryOne/:messageId', AuthMiddleWare(Object.values(ROLES)), asyncHandler(deleteMessageForEveryOne));
        router.post('/clearChat', AuthMiddleWare(Object.values(ROLES)), asyncHandler(clearChat));
        router.post('/votePoll', AuthMiddleWare(Object.values(ROLES)),  asyncHandler(votePoll));
        router.post('/get-poll-details',AuthMiddleWare(Object.values(ROLES)), asyncHandler(getPollDetails));
        router.post('/update-poll-result', AuthMiddleWare(Object.values(ROLES)), asyncHandler(updatePollStatus));

        // router.post('/removeChat', AuthMiddleWare(Object.values(ROLES)), removeChat);

    }

    getRouter () {
        return this.router;
    }

    getRouterGroup () {
        return '/message';
    }
}

module.exports = MessageAPI;