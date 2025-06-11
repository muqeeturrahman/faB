"use strict";

const { Router } = require("express");
const authMiddleware = require("../middlewares/AuthMiddleWare");
const { ROLES } = require('../utils/constants');
const { handleMultipartData } = require("../utils/multipart");
const {asyncHandler} = require('../middlewares/genericResHandler'); 
const { createHelpTicket } = require("../controller/help");

class HelpAPI {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    const router = this.router;
    router.post(
      "/create-help-ticket",
      authMiddleware(),
      handleMultipartData.fields([
        {
          name: "image",
          maxCount: 10,
        },
      ]),
      asyncHandler(createHelpTicket)
    );
  }

  getRouter() {
    return this.router;
  }

  getRouterGroup() {
    return "/help";
  }
}

module.exports = HelpAPI;
