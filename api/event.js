"use strict";

const { Router } = require("express");
const {
  createEvent,
  updateEvent,
  getUserEvents,
  deleteEvent,
} = require("../controller/events");
const AuthMiddleWare = require("../middlewares/AuthMiddleWare");
const { handleMultipartData } = require("../utils/multipart");
const {ROLES} = require("../utils/constants");
const { asyncHandler } = require("../middlewares/genericResHandler");
class EventAPI {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    const router = this.router;
    router.post(
      "/add-event",
      AuthMiddleWare(Object.values(ROLES)),
      handleMultipartData.fields([
        {
          name: "media",
          maxCount: 50,
        },
      ]),
      asyncHandler(createEvent)
    );

    router.post(
      "/update-event",
      AuthMiddleWare(Object.values(ROLES)),
      handleMultipartData.fields([
        {
          name: "media",
          maxCount: 50,
        },
      ]),
      asyncHandler(updateEvent)
    );

    router.get("/get-user-events", AuthMiddleWare(Object.values(ROLES)), asyncHandler(getUserEvents));

    router.post("/delete-event", AuthMiddleWare(Object.values(ROLES)), asyncHandler(deleteEvent));
  }

  getRouter() {
    return this.router;
  }

  getRouterGroup() {
    return "/event";
  }
}

module.exports = EventAPI;
