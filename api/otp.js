'use strict';

const { Router } = require('express');
const { verifyOtp, generateOTP, verifyforgotOtp, forgotPassword } = require('../controller/otp');
const AuthMiddleWare = require('../middlewares/AuthMiddleWare');
const { asyncHandler } = require('../middlewares/genericResHandler');

class OtpAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        const router = this.router;
        router.post('/verify-otp', AuthMiddleWare(), asyncHandler(verifyOtp));
        router.post('/verify-fogot-otp', AuthMiddleWare(), asyncHandler(verifyforgotOtp));
        router.post("/generate-otp",asyncHandler(generateOTP))
        router.post("/send-otp",asyncHandler(forgotPassword))

      

    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/otp';
    }
}

module.exports = OtpAPI; 