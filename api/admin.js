'use strict';

const { Router } = require('express');
const AdminMiddleWare = require('../middlewares/AdminMiddleWare');
const { createVibes, createPrefences,getAllUsers, createCategories ,toggleEnableDisable,getGroupedData,updateEventStatus,getDeleteRequests,deleteRequestStatus } = require('../controller/admin');
const { ROLES } = require('../utils/constants');
const {asyncHandler} = require('../middlewares/genericResHandler') 

class AdminAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        const router = this.router;
        router.post('/create-vibes', AdminMiddleWare([ROLES.ADMIN]), asyncHandler(createVibes));
        router.post('/create-categories', AdminMiddleWare([ROLES.ADMIN]), asyncHandler(createCategories));
        router.post('/create-prefences', AdminMiddleWare([ROLES.ADMIN]), asyncHandler(createPrefences));
        router.post('/getAllUsers', AdminMiddleWare([ROLES.ADMIN]), asyncHandler(getAllUsers));
        router.post('/toggleEnableDisable', AdminMiddleWare([ROLES.ADMIN]), asyncHandler(toggleEnableDisable));
        router.post('/groupUsersByCriteria', AdminMiddleWare([ROLES.ADMIN]), asyncHandler(getGroupedData));
        router.post('/updateEventStatus', AdminMiddleWare([ROLES.ADMIN]), asyncHandler(updateEventStatus));
        router.get('/getDeleteRequests', AdminMiddleWare([ROLES.ADMIN]), asyncHandler(getDeleteRequests));
        router.post('/deleteRequestStatus', AdminMiddleWare([ROLES.ADMIN]), asyncHandler(deleteRequestStatus));

    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/admin';
    }
}

module.exports = AdminAPI; 