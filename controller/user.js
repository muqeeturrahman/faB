const { findUsers, findUser, updateUserById } = require("../models/user");
const { createOrUpdateUserMood, findUsermood } = require("../models/userMood");
const {  getVibes} = require("../models/vibesModel");
const { getCategory } = require("../models/category")
const { getPrefenceQuery } = require("../models/vibespPrefences");
const { generateResponse, parseBody } = require("../utils");
const { IsNotificationValidator,getusersbynameValdator } = require('../validations/userValidator')
const {finduserbyname}=require("../models/userProfile")
const { STATUS_CODE } = require('../utils/constants')

exports.createorUpdateMoods = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    body.authId = req.user.id;
    //for create mood
    const userMoods = await createOrUpdateUserMood(body);

    // if(req.user.role === "organization")
    UserData = await findUser({ _id: req.user.id }).populate({
      path: "profileId", // Specify the fields you want to populate
      model: "userprofiles",
      populate: {
        path: "profileImage",
      },
    });

    //for get again user mood requirement forntend
    const userMood = await findUsermood({authId:req.user.id });

    User = {
      ...UserData.toObject(),
      userMood,
    };

    if (userMood) {
      generateResponse({ User: User }, "User mood set successfully", res);
    } else {
    }
  } catch (e) {
    next(new Error(e.message));
  }
};

exports.getUserMoods = async (req, res, next) => {
  try {
    const vibes = await findUsermood({ authId: req.user.id });
    generateResponse(vibes, "Get User Mood Successfully", res);
  } catch (e) {
    next(new Error(e));
  }
};

exports.getVibes = async (req, res, next) => {
  try {
    const vibes = await getVibes({});
    generateResponse(vibes, "Get Vibes Successfully", res);
  } catch (e) {
    next(new Error(e));
  }
};
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await getCategory({});
    generateResponse(categories, "Categories Get Successfully", res);
  } catch (e) {
    next(new Error(e));
  }
};
exports.getPrefences = async (req, res, next) => {
  try {
    const Prefences = await getPrefenceQuery({});
    generateResponse(Prefences, "Get Prefences Successfully", res);
  } catch (e) {
    next(new Error(e));
  }
};

exports.NotificationOn = async (req, res, next) => {
  try{
    let { isNotification } = req.body;
    let {error} = IsNotificationValidator.validate(req.body);
    
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

    let updatedUser = await updateUserById(req.user.id, { isNotification: isNotification})
    if(updatedUser){
      generateResponse(updatedUser, "Notification Updated Successfully", res);

    }
  }catch(error){
    next(new Error(error));

  }
}

exports.getusersbyname = async (req, res, next) => {
  try {
    // Extract session details from request body
    const body = parseBody(req.body);
    const { error } = getusersbynameValdator.validate(body);

    if (error) {
      const errorMessage = error.details && error.details[0]
        ? error.details[0].message
        : "Validation error";
      return next({
        status: false,
        statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
        message: errorMessage,
      });
    }

    const { username } = body;

    const users = await finduserbyname({
      firstName: { $regex: new RegExp(`^${username}`, 'i') }, 
    });

    if (users.length === 0) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: `No users found with this firstname containing: ${username}`,
      });
    }

    const authIds = users?.map(user => user?.authId);
    const auth = await findUsers({ 
      _id: { $in: authIds, $ne:  req.user.id }, // Exclude the logged-in user
      role: { $ne: "admin" } // Exclude admin users
    });
    if (auth.length === 0) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: `No users found with this firstname containing: ${username}`,
      });
    }
    generateResponse({ auth }, "Users fetched successfully", res);

  } catch (error) {
    next({
      status: false,
      statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
      message: error.message,
    });
  }
}



