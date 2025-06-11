'use strict';

const { Router } = require('express');
const { createService, updateService, getUserServices , filerServices, getAllTheVerifiedService, deleteService, getServiceForHomeScreen, fetchServices,getService,serviceAnalytics,favoriteServiceToggle,favoriteServicesList, getServiceForBooking} = require('../controller/service');
const {createBooking,getBookings,cancelBooking}=require("../controller/booking")
const {createBookingReview,getReviews}=require("../controller/Review")
const AuthMiddleWare = require('../middlewares/AuthMiddleWare');
const { handleMultipartData } = require("../utils/multipart");
const { ROLES } = require('../utils/constants');
const { asyncHandler } = require('../middlewares/genericResHandler');

class ServiceAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        const router = this.router;
        router.post('/create-service', AuthMiddleWare(Object.values(ROLES)), handleMultipartData.fields([
            {
              name: "media",
              maxCount: 50,
            }

          ]), asyncHandler(createService));

          router.post('/update-service', AuthMiddleWare(Object.values(ROLES)), handleMultipartData.fields([
            {
              name: "media",
              maxCount: 50,
            }

          ]), asyncHandler(updateService));

          router.get('/get-service', AuthMiddleWare(Object.values(ROLES)), asyncHandler(getUserServices));
          router.post('/delete-service', AuthMiddleWare(Object.values(ROLES)), asyncHandler(deleteService) )
          router.post('/search', AuthMiddleWare(Object.values(ROLES)), asyncHandler(fetchServices));
          router.post('/get-services-by-status', AuthMiddleWare((ROLES)), asyncHandler(getServiceForHomeScreen));
          router.post("/filter-services", AuthMiddleWare((ROLES)), asyncHandler(filerServices))
          router.post('/createBooking', AuthMiddleWare((ROLES.USER)), asyncHandler(createBooking));
          router.get('/getBookings', AuthMiddleWare((ROLES.USER)), asyncHandler(getBookings));
          router.post('/cancelBooking', AuthMiddleWare((ROLES.USER)), asyncHandler(cancelBooking));
          router.post('/createBookingReview', AuthMiddleWare(([ROLES.USER])), asyncHandler(createBookingReview));
          router.post('/clickCount/:id', AuthMiddleWare([ROLES.USER]), asyncHandler(getService));
          router.get('/servicesAnalytics', AuthMiddleWare([ROLES.ORGANIZATION]), asyncHandler(serviceAnalytics));
          router.post('/getReviews', AuthMiddleWare([ROLES.USER]), asyncHandler(getReviews));
          router.get('/get-recommendations', AuthMiddleWare((ROLES.USER)), asyncHandler(getAllTheVerifiedService));
          router.post('/favoritestoggle', AuthMiddleWare([ROLES.USER]), asyncHandler(favoriteServiceToggle));
          router.get('/favoriteslist', AuthMiddleWare([ROLES.USER]), asyncHandler(favoriteServicesList));
          router.post('/get-service-for-booking', AuthMiddleWare((ROLES.USER)), asyncHandler(getServiceForBooking))

    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/service';
    }
}

module.exports = ServiceAPI