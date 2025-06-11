'use strict';

const { Router } = require('express');
const { verifyOtp, generateOTP } = require('../controller/otp');
const AuthMiddleWare = require('../middlewares/AuthMiddleWare');
const { getVibes, getCategories, getPrefences, createorUpdateMoods, getUserMoods, NotificationOn, getusersbyname  } = require('../controller/user');
const { ROLES } = require('../utils/constants');
const { asyncHandler } = require('../middlewares/genericResHandler');

class UserAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        const router = this.router;
        router.get('/get-vibes', AuthMiddleWare(), asyncHandler(getVibes));
        router.get('/get-categories', AuthMiddleWare(), asyncHandler(getCategories));
        router.get('/get-prefences', AuthMiddleWare(), asyncHandler(getPrefences));
        router.post('/create-set-mood', AuthMiddleWare(), asyncHandler(createorUpdateMoods));
        router.get('/get-mood-user', AuthMiddleWare(), asyncHandler(getUserMoods));      
        router.post('/update-notification-status', AuthMiddleWare(Object.values(ROLES)), asyncHandler(NotificationOn))
        router.post('/getusersbyusername', AuthMiddleWare(Object.values(ROLES)), asyncHandler(getusersbyname))

    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/user';
    }
}

module.exports = UserAPI; 