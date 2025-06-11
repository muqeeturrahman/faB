"use strict";

const { Router } = require("express");
const {
  register,
  verifytoken,
  createProfile,
  login,
  changePassword,
  updateProfile,
  deleteAccount,
  deleteRequest
} = require("../controller/auth");
const authMiddleware = require("../middlewares/AuthMiddleWare");
const { ROLES } = require('../utils/constants');
const { handleMultipartData } = require("../utils/multipart");
const { object } = require("joi");
const {asyncHandler} = require('../middlewares/genericResHandler') 

class AuthAPI {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    const router = this.router;
    router.post("/register", asyncHandler(register));
    router.post("/verify-token", asyncHandler(verifytoken));
    router.post("/change-password", authMiddleware(), asyncHandler(changePassword));
    router.post("/deleteAccount", authMiddleware(Object.values(ROLES)),asyncHandler( deleteAccount));
    router.post("/deleteRequest", authMiddleware(Object.values(ROLES)),asyncHandler( deleteRequest));
    router.post(
      "/create-profile",
      authMiddleware(),
      handleMultipartData.fields([
        {
          name: "profileImage",
          maxCount: 1,
        },
        {
          name: "portfolioImage",
          maxCount: 10,
        },
      ]),
      asyncHandler(createProfile)
    );
    router.put(
      "/update-profile",
      authMiddleware(),
      handleMultipartData.fields([
        {
          name: "profileImage",
          maxCount: 1,
        },
        {
          name: "portfolioImage",
          maxCount: 10,
        },
      ]),
      asyncHandler(updateProfile)
    );
    router.post("/login", asyncHandler(login));
  }

  getRouter() {
    return this.router;
  }

  getRouterGroup() {
    return "/auth";
  }
}

module.exports = AuthAPI;
