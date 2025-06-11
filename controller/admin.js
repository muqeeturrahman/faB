const { createVibesQuery } = require("../models/vibesModel");
const {createCategoryQuery} = require("../models/category.js")
const { createPrefenceQuery } = require("../models/vibespPrefences");
const { generateResponse, parseBody } = require("../utils");
const { STATUS_CODE, NOTIFICATION_TYPE, NOTIFICATION_RELATED_TYPE } = require("../utils/constants");
const mongoose = require('mongoose');
const { VibesValidator, CategoryValidator, PrefenceValidator, getuserprofileValidator, toggleEnableDisableValidator, updateEventStatusValidator } = require("../validations/userValidator");
const { getUsers, findUser, updateUserById, groupUsersByCriteria, finduserByid } = require('../models/user');
const { getgroupUsers } = require('../models/userMood');
const { updateEvent } = require("../models/events");
const { createAndSendNotification } = require("../models/notificationModel.js")
const { createRequest, findRequest, findRequests, updateRequest } = require("../models/deleteRequest")
/*
email:admin123@yopmail.com,
password:admin
*/

//view user profile done
exports.getAllUsers = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { error } = getuserprofileValidator.validate(body);
    if (error) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: error.details.map(detail => detail.message).join(', '),
      });
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const users = await getUsers(body.role, page, limit);
    if (users['data'].length === 0) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Users not found!",
      });
    }
    generateResponse(users, "Users fetched successfully", res);
  } catch (e) {
    next({
      status: false,
      statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
      message: e.message || 'An error occurred while fetching users',
    });
  }
};


//•	Enable/disable user accounts.
exports.toggleEnableDisable = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { error } = toggleEnableDisableValidator.validate(body);
    if (error) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: error.details.map(detail => detail.message).join(', '),
      });
    }
    let user = await finduserByid(body.userId);
    if (!user) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: 'User not found!',
      });
    }

    user = await updateUserById(body.userId, { isActive: body.isActive });
    // Respond with success
    generateResponse(
      user,
      "User status updated successfully",
      res
    );
  } catch (e) {
    next(new Error(e.message));
  }
};


//•	Group users based on different criteria 
exports.getGroupedData = async (req, res, next) => {
  try {
    const {
      groupSize,
      moodDistance,
      moodLocation,
      moodTime,
      prefenceNames = [],
      vibesNames = [],
      location
    } = parseBody(req.body)


    const matchConditions = {};
    if (groupSize) matchConditions.groupSize = groupSize;
    if (moodDistance) matchConditions.moodDistance = moodDistance;
    if (moodLocation) matchConditions.moodLocation = moodLocation;
    if (moodTime) matchConditions.moodTime = moodTime;
    if (prefenceNames.length > 0) {
      matchConditions["moodPrefernces"] = {
        $elemMatch: {
          prefenceName: { $in: prefenceNames }
        }
      };
    }
    if (vibesNames.length > 0) {
      matchConditions["moodVibes"] = {
        $elemMatch: {
          vibesName: { $in: vibesNames }
        }
      };
    }

    if (location) {
      matchConditions["authId.profileId.location"] = {
        $geoWithin: {
          $centerSphere: [
            location.map(Number),
            0.05 //in 0.05km range
          ]
        }
      };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const users = await getgroupUsers(matchConditions, page, limit);

    if (users['data'].length === 0) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Users not found!",
      });
    }

    generateResponse(users, "Users fetched successfully", res);
  } catch (error) {
    next({
      status: false,
      statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
      message: error.message || 'An error occurred while fetching users',
    });
  }
}


exports.updateEventStatus = async (req, res, next) => {
  try {
    //const { serviceId, status }
    const body = parseBody(req.body);
    const { error } = updateEventStatusValidator.validate(body);
    if (error) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: error.details.map(detail => detail.message).join(', '),
      });
    }
    const { eventId, status } = body;

    // Find the service by ID and update the status
    const updatedEvent = await updateEvent(
      eventId,
      { status: status }
    );

    if (!updatedEvent) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Event not found!",
      });
    }

    //Notifaction work
    const sender = req.user;
    const receiverIds = [updatedEvent.user];
    const type = NOTIFICATION_TYPE.EVENT_APPROVED;
    const sourceId = body.eventId;
    const relatedId = req.user;
    const relatedType = NOTIFICATION_RELATED_TYPE.EVENT


    const notifaction = await createAndSendNotification({ senderObject: sender, receiverIds: receiverIds, type: type, sourceId: sourceId, relatedId: relatedId, relatedType: relatedType })
    generateResponse(updatedEvent, "Event status updated successfully", res);

  } catch (error) {
    // Handle any unexpected errors
    next({
      status: false,
      statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
      message: error.message || 'An error occurred while updating Event status',
    });
  }
};


exports.createVibes = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { error } = VibesValidator.validate(body);

    if (error) {
      const errorMessage =
        error.details && error.details[0]
          ? error.details[0].message
          : "Validation error";
      return next({
        status: false,
        statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
        message: errorMessage,
      });
    }

    const obj = await createVibesQuery(body);
    generateResponse(
      obj,
      "Create Vibes Successfully",
      res
    );
  } catch (e) {
    next(new Error(e));
  }
};

exports.createCategories = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { error } = CategoryValidator.validate(body);

    if (error) {
      const errorMessage =
        error.details && error.details[0]
          ? error.details[0].message
          : "Validation error";
      return next({
        status: false,
        statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
        message: errorMessage,
      });
    }

    const obj = await createCategoryQuery(body);
    generateResponse(
      obj,
      "Category Created Successfully",
      res
    );
  } catch (e) {
    next(new Error(e));
  }
};

exports.createPrefences = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { error } = PrefenceValidator.validate(body);

    if (error) {
      const errorMessage =
        error.details && error.details[0]
          ? error.details[0].message
          : "Validation error";
      return next({
        status: false,
        statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
        message: errorMessage,
      });
    }

    const obj = await createPrefenceQuery(body);
    generateResponse(
      obj,
      "Create Prefences Successfully",
      res
    );
  } catch (e) {
    next(new Error(e));
  }
};

exports.getDeleteRequests = async (req, res, next) => {
  try {
    const getDeleteRequest = await findRequests({ requestStatus: "pending" })
    .populate("user")
    generateResponse(getDeleteRequest, "Delete account requests", res);

  } catch (e) {
    next(new Error(e));
  }
};

exports.deleteRequestStatus = async (req, res, next) => {
  try {
    const { _id, requestStatus } = req.body;
    const Status = await updateRequest(
     _id ,
      {
        requestStatus,
      },
      {
        new: true,
      }
    );
    console.log(Status, "status>>>>>>>");

    if (requestStatus === "accepted") {
      const deleteUser = await updateUserById(
        { _id: Status.user},
        { isDeleted: true }
      );
    }
    generateResponse([], "Delete account requests", res);

  } catch (e) {
    next(new Error(e));
  }
};
