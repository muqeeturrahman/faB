const { generateResponse, parseBody } = require("../utils");
const mongoose = require("mongoose");
const {
  STATUS_CODE,
  NOTIFICATION_TYPE,
  NOTIFICATION_RELATED_TYPE,
} = require("../utils/constants");
const {
  createSessionValidator,
  joinSessionValidator,
  useridValidator,
  sessionidValidator,
} = require("../validations/sessionValidator");
const {
  findSession,
  createSession,
  findSessionusersbyid,
  findSessionupdatesbyid,
  findSessionsByUserId,
  findSessionbyid,
  deleteSessionbyid,
  findJoinedSession,
  updateSessionById,
} = require("../models/sessionModel");
const {
  findinvitedusersbyid,
  findInvitedUserSchemabySessionId,
  deleteinvitedusersbyid,
} = require("../models/inviteModel");
const { createSessionMoods, findUsersSessionMoods } = require("../models/sessionMoodsModel");
const { finduserByid } = require("../models/user");
const { generateRandomOTP } = require("../utils/index");
const { finduserbyauthid } = require("../models/userProfile");
const { createInvitedUsersObj } = require("../models/inviteModel");
const {
  createAndSendNotification,
  getNotificationsbysourceid,
  user_notification_count,
} = require("../models/notificationModel");
const { getVibes } = require("../models/vibesModel");
const { getPrefenceQuery } = require("../models/vibespPrefences");
const { sessionUpdates } = require("../socket/socket");
const { Types } = require("mongoose");
const { processUsers } = require("../utils/helper.js");
//done and tested
const { RecommendationSystem } = require("../models/services.js")
const {
  getFavorites,
} = require("../models/favorties.js");

exports.sessionCreate = async (req, res, next) => {
  try {
    // 1) Parse body
    const body = parseBody(req.body);

    // 2) Apply validator on body
    const { error } = createSessionValidator.validate(body);
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

    // 3) Extract variables from body
    const {
      sessionName,
      sessionVibes,
      moodLocation,
      sessionPreference,
      groupSize,
      sessionDistance,
      sessionTime,
      invitedusers,
    } = body;

    // 4) Check if invited user IDs exist or not
    for (let i = 0; i < invitedusers.length; i++) {
      let isExist = await finduserByid(invitedusers[i]);
      if (!isExist) {
        return next({
          status: false,
          statusCode: STATUS_CODE.NOT_FOUND,
          message: `User with ID: ${invitedusers[i]} not found!`,
        });
      }
    }

    const vibes = await getVibes({ _id: { $in: sessionVibes } });
    const preferences = await getPrefenceQuery({
      _id: { $in: sessionPreference },
    });

    if (vibes.length !== sessionVibes.length) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "One or more vibes IDs are invalid!",
      });
    }

    if (preferences.length !== sessionPreference.length) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "One or more preferences IDs are invalid!",
      });
    }

    // 5) Generate session code
    const sessionCode = generateRandomOTP();

    // 6) Create session
    const session = await createSession({
      user: req.user.id,
      sessionName,
      sessionCode,
      sessionusers: [req.user.id],
    });

    // 7) Create session mood for the created session
    const sessionMoods = await createSessionMoods({
      userid: req.user.id,
      session: session._id,
      sessionVibes,
      moodLocation,
      sessionPreference,
      groupSize,
      sessionDistance,
      sessionTime,
    });

    // 8) Invite users
    const invitedUserObj = await createInvitedUsersObj({
      sessionId: session._id,
      userId: req.user.id,
      invitedUser: invitedusers,
    });

    // 9) Send real-time notifications to invited users
    const sender = req.user;
    const receiverIds = invitedusers;
    const type = NOTIFICATION_TYPE.SESSION_REQUEST;
    const sourceId = session._id;
    const relatedId = req.user;
    const relatedType = NOTIFICATION_RELATED_TYPE.SESSION;
    const competition = {
      sessionCode,
      sessionName,
    };
    const notifaction = await createAndSendNotification({
      senderObject: sender,
      receiverIds: receiverIds,
      type: type,
      sourceId: sourceId,
      relatedId: relatedId,
      relatedType: relatedType,
      competition,
    });
    // 10) Generate response
    console.log("--------notifcaion while creating session:", notifaction);
    generateResponse(
      { session, sessionMoods, invitedUserObj },
      "Session created successfully",
      res
    );
  } catch (error) {
    next(new Error(error.message));
  }
};

//done and tested
exports.joinSession = async (req, res, next) => {
  try {
    // Step 1: Extracting input
    const {
      sessionVibes,
      moodLocation,
      sessionPreference,
      groupSize,
      sessionDistance,
      sessionTime,
      sessionCode,
    } = req.body;

    // Step 2: Getting logged-in user ID
    const user = req?.user?.id;
    console.log("Session Code:", sessionCode);

    // Step 3: Get session by session code
    const session = await findSession({ sessionCode });
    if (!session) {
      return next({
        status: false,
        statusCode: STATUS_CODE.CONFLICT,
        message: "Invalid session code",
      });
    }
    console.log("------------", session);
    // Finding invited user schema because only invited users can join the session
    const inviteduserSchema = await findInvitedUserSchemabySessionId(
      session._id
    );
    if (!inviteduserSchema || inviteduserSchema.invitedUser.length === 0) {
      return next({
        status: false,
        statusCode: STATUS_CODE.CONFLICT,
        message: "No users are invited to this session",
      });
    }

    // Get index if the user is in the invited array
    const invitedUserIndex = inviteduserSchema.invitedUser.findIndex((u) =>
      u.equals(user)
    );

    // Check if the user is already in session users or not invited
    if (invitedUserIndex == -1) {
      return next({
        status: false,
        statusCode: STATUS_CODE.CONFLICT,
        message: "User already in session or user not invited",
      });
    }

    // Remove user from invited list and save
    inviteduserSchema.invitedUser.splice(invitedUserIndex, 1);
    await inviteduserSchema.save();

    // Create session moods
    const sessionMoods = await createSessionMoods({
      userid: user,
      session: session._id,
      sessionVibes,
      moodLocation,
      sessionPreference,
      groupSize,
      sessionDistance,
      sessionTime,
    });

    const userProfile = await finduserbyauthid({ authId: user });
    const update = `${userProfile?.firstName} ${userProfile?.lastName} has joined the session.`;
    // Add user to session users list
    session.sessionusers.push(user);
    session.updates.push(update);
    await session.save();
    const updates = session.updates;
    // Send notification to session owner
    const sender = req.user;
    const receiverIds = [session.user];
    const type = NOTIFICATION_TYPE.SESSION_JOINED;
    const sourceId = session._id;
    const relatedId = req.user;
    const relatedType = NOTIFICATION_RELATED_TYPE.SESSION;
    const notification = await createAndSendNotification({
      senderObject: sender,
      receiverIds,
      type,
      sourceId,
      relatedId,
      relatedType,
    });

    // Fetch users who joined and are still awaiting
    const joinedusers = await findSessionusersbyid(session._id);

    const awaitingusers = await findinvitedusersbyid(session._id);

    const joinedUsersWithRole = joinedusers.map((user) => {
      if (session.user._id.equals(user._id)) {
        return {
          ...user.toObject(),
          role: "host", // Assign 'host' if the user is the session host
        };
      } else {
        return {
          ...user.toObject(),
          role: "user", // Assign 'joined' for other users in joinedusers array
        };
      }
    });

    // Map through awaitingusers and assign the 'awaiting' role
    const awaitingUsersWithRole = awaitingusers.map((user) => ({
      ...user.toObject(),
      role: "user", // All users in awaitingusers will get the 'awaiting' role
    }));

    console.log("joo", joinedusers);
 

    // Merging both
    const users = processUsers(joinedUsersWithRole, awaitingUsersWithRole);
    let userIds = users.map(user => user._id);

    // Map to extract the remaining user IDs
    const foundSession = await findSession({ sessionCode });

    // const notifications = await getNotificationsbysourceid(session._id);
    // const senderIds = notifications
    //   .filter(notification => notification.title === "Session Joined" && notification.sender)
    //   .map(notification => notification.sender);

    // let Updates = [];
    // for (const senderId of senderIds) {
    //   try {
    //     const user = await finduserbyauthid({ authId: senderId });
    //     if (user) {
    //       const message = `${user.firstName} ${user.lastName} has joined the session.`;
    //       Updates.push(message);
    //     } else {
    //       console.log(`User with ID ${senderId} not found.`);
    //     }
    //   } catch (error) {
    //     console.error(`Error fetching user with ID ${senderId}:`, error);
    //   }
    // }

    // console.log("Users and Updates:", users, Updates);

    // Send socket updates
    let data = { users, updates, foundSession };
    for (const user of userIds) {
      console.log("🚀 ~ exports.joinSession= ~ session_user:", user)
      console.log("🚀 ~ exports.joinSession= ~ foundSession._id:", foundSession._id)
      // console.log("🚀 ~ exports.joinSession= ~ { user, session, data }:", { session_user, foundSession._id , data })
      
      sessionUpdates(user,  foundSession._id, data);
      
    }
    

    // Generate response
    generateResponse(
      { session, sessionMoods },
      "User joined the session successfully",
      res
    );
  } catch (error) {
    next({
      status: false,
      statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
      message: error.message,
    });
  }
};

exports.getServices = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    const session = await findSession({ _id: sessionId });
    const sessionUsers = session?.sessionusers; 
    let results = await findUsersSessionMoods({$in: {userid: sessionUsers}, session: sessionId})
    const usersvibespreferences = []

    results.forEach((result) => {
      if (result.sessionVibes) {
        usersvibespreferences.push(...result.sessionVibes);
      }
      if (result.sessionPreference) {
        usersvibespreferences.push(...result.sessionPreference);
      }
    });
    let services = [];
      let Recommendations = await RecommendationSystem(usersvibespreferences)
      if(Recommendations.length > 0){
       services = await Promise.all( Recommendations.map(async (e) => {
        const favorite = await getFavorites(e._id , req.user.id)
        let obj = e;
        if(favorite.length > 0) {
          obj.isFavourite = true;
        }
        else{
          obj.isFavourite = false;
        }
        return obj;
      })
      );
    }
      
      generateResponse(
        services,
        "Here Is The Recommendation...",
        res
      );
    //sessionname,total number of joined users,created at
  } catch (error) {
    next(new Error(error.message))
  }
};
//done and tested
exports.getMySessions = async (req, res, next) => {
  try {
    const userid = req?.user?.id;
    if (!userid) {
      throw {
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "User ID is required.",
      };
    }

    const sessions = await findSessionsByUserId(userid);

    if (sessions.length === 0) {
      throw {
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "No sessions found for this user.",
      };
    }

    const sessionsWithDetails = sessions.map((session) => ({
      _id: session._id,
      sessionName: session.sessionName,
      totalMembers: session.sessionusers.length,
      createdAt: session.createdAt,
    }));

    generateResponse(
      { sessions: sessionsWithDetails },
      "Sessions fetched successfully",
      res
    );
  } catch (error) {
    next({
      status: false,
      statusCode: error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR,
      message: error.message || "An internal server error occurred",
    });
  }
};
//done and tested
exports.getSessionDetailsById = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { sessionid } = parseBody(req.body);
    const sessionidValidation = sessionidValidator.validate({ sessionid });

    if (sessionidValidation.error) {
      throw {
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: sessionidValidation.error.details[0].message,
      };
    }

    const foundSession = await findSessionbyid(sessionid).session(session);

    if (!foundSession) {
      throw {
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "No session found for this session Id",
      };
    }

    // let joinedusers = await findSessionusersbyid(sessionId);
    // const awaitingusers = await findinvitedusersbyid(sessionId);

    // // Processing both responses, adding status field
    // const u1 = joinedusers.sessionusers.map(user => ({
    //   ...user.toObject(),
    //   status: 'Joined'
    // }));

    // const u2 = awaitingusers.invitedUser.map(user => ({
    //   ...user.toObject(),
    //   status: 'awaiting'
    // }));

    // // Merging both
    // const allUsers = [...u1, ...u2];

    // Fetch notifications related to the session
    const joinedusers = await findSessionusersbyid(foundSession._id);
    const awaitingusers = await findinvitedusersbyid(foundSession._id);

    const joinedUsersWithRole = joinedusers.map((user) => {
      if (foundSession.user._id.equals(user._id)) {
        return {
          ...user.toObject(),
          role: "host", // Assign 'host' if the user is the session host
        };
      } else {
        return {
          ...user.toObject(),
          role: "user", // Assign 'joined' for other users in joinedusers array
        };
      }
    });

    // Map through awaitingusers and assign the 'awaiting' role
    const awaitingUsersWithRole = awaitingusers.map((user) => ({
      ...user.toObject(),
      role: "user", // All users in awaitingusers will get the 'awaiting' role
    }));
    const users = processUsers(joinedUsersWithRole, awaitingUsersWithRole);
    const updates = foundSession.updates;
    //   const notifactions = await getNotificationsbysourceid(foundSession._id);
    //   const senderIds = notifactions
    //     .filter(notification => notification.title === "Session Joined" && notification.sender)
    //     .map(notification => notification.sender);
    //  console.log(">>>>>>>>>>>>>>>>s",senderIds)
    //   let sessionupdates = [];

    //   // Process each senderId to fetch user details and construct messages
    //   for (const senderId of senderIds) {
    //     try {
    //       const user = await finduserbyauthid({authId:senderId});
    //       console.log(">>>>>>>>>>>>>>>>",user)
    //       if (user) {
    //         const message = `${user.firstName} ${user.lastName} has joined the session.`;
    //         sessionupdates.push(message);
    //       } else {
    //         console.log(`User with ID ${senderId} not found.`);
    //       }
    //     } catch (error) {
    //       console.error(`Error fetching user with ID ${senderId}:`, error);
    //     }
    //   }

    // Generate response
    generateResponse(
      { users: users, updates: updates, foundSession },
      "Session details fetched successfully",
      res
    );
  } catch (error) {
    next({
      status: false,
      statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
      message: error.message,
    });
  }
};
//done and tested
exports.removeUser = async (req, res, next) => {
  try {
    const { userId, sessionid } = parseBody(req.body);

    const sessionidValidation = sessionidValidator.validate({ sessionid });
    if (sessionidValidation.error) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: sessionidValidation.error.details[0].message,
      });
    }

    const userIdValidation = useridValidator.validate({ userId });
    if (userIdValidation.error) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: userIdValidation.error.details[0].message,
      });
    }

    const loggedInUserId = req.user.id;

    const foundSession = await findSessionbyid(sessionid);
    if (!foundSession) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "No session found for this session Id",
      });
    }

    if (userId === foundSession.user.toString()) {
      return next({
        status: false,
        statusCode: STATUS_CODE.FORBIDDEN,
        message: "Host can't remove themselves from the session.",
      });
    }

    if (loggedInUserId !== foundSession.user.toString()) {
      return next({
        status: false,
        statusCode: STATUS_CODE.FORBIDDEN,
        message: "Only the host can remove users from the session.",
      });
    }

    const sessionuserIndex = foundSession.sessionusers.findIndex((u) =>
      u.equals(userId)
    );
    const invitedUserSchema = await findInvitedUserSchemabySessionId(sessionid);
    const invitedUserIndex = invitedUserSchema.invitedUser.findIndex((u) =>
      u.equals(userId)
    );

    if (sessionuserIndex !== -1) {
      foundSession.sessionusers.splice(sessionuserIndex, 1);
    } else if (invitedUserIndex !== -1) {
      invitedUserSchema.invitedUser.splice(invitedUserIndex, 1);
      await invitedUserSchema.save();
    } else {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "User not found in session or invited list",
      });
    }

    const userProfile = await finduserbyauthid({ authId: userId });
    const update = `${userProfile?.firstName} ${userProfile?.lastName} has been removed from the session.`;
    foundSession.updates.push(update);
    await foundSession.save();

    const joinedusers = await findSessionusersbyid(foundSession._id);
    const awaitingusers = await findinvitedusersbyid(foundSession._id);

    const joinedUsersWithRole = joinedusers.map((user) => {
      if (foundSession.user._id.equals(user._id)) {
        return {
          ...user.toObject(),
          role: "host", // Assign 'host' if the user is the session host
        };
      } else {
        return {
          ...user.toObject(),
          role: "user", // Assign 'joined' for other users in joinedusers array
        };
      }
    });

    // Map through awaitingusers and assign the 'awaiting' role
    const awaitingUsersWithRole = awaitingusers.map((user) => ({
      ...user.toObject(),
      role: "user", // All users in awaitingusers will get the 'awaiting' role
    }));
    const users = processUsers(joinedUsersWithRole, awaitingUsersWithRole);
    let userIds = users.map(user => user._id);

    const data = { users, updates: foundSession.updates, foundSession };


    // for other users
    for (const session_user of userIds) {
      sessionUpdates(user = session_user, (session = foundSession._id), data);
    }
    
    // for removed user
    sessionUpdates(user = userId, (session = foundSession._id), data);

    generateResponse(
      { session: foundSession },
      "User removed from session or invited list successfully",
      res
    );
  } catch (error) {
    next({
      status: false,
      statusCode: error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR,
      message: error.message || "An internal server error occurred",
    });
  }
};
//done and tested
exports.leavesession = async (req, res, next) => {
  try {
    const { sessionid } = parseBody(req.body);

    const sessionidValidation = sessionidValidator.validate({ sessionid });
    if (sessionidValidation.error) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: sessionidValidation.error.details[0].message,
      });
    }

    const loggedInUserId = req.user.id;

    const foundSession = await findSessionbyid(sessionid);

    if (!foundSession) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "No session found for this session Id",
      });
    }

    if (loggedInUserId == foundSession.user.toString()) {
      return next({
        status: false,
        statusCode: STATUS_CODE.FORBIDDEN,
        message: "Host can't leave the session.",
      });
    }

    const sessionuserIndex = foundSession.sessionusers.findIndex((u) =>
      u.equals(loggedInUserId)
    );

    if (sessionuserIndex === -1) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "User not found in session users list",
      });
    }

    foundSession.sessionusers.splice(sessionuserIndex, 1);

    // Socket work
    const userProfile = await finduserbyauthid({ authId: loggedInUserId });
    const update = `${userProfile?.firstName} ${userProfile?.lastName} has left the session.`;
    foundSession.updates.push(update);

    await foundSession.save();

    const updates = foundSession.updates;
    const joinedusers = await findSessionusersbyid(foundSession._id);
    const awaitingusers = await findinvitedusersbyid(foundSession._id);

    const joinedUsersWithRole = joinedusers.map((user) => {
      if (foundSession.user._id.equals(user._id)) {
        return {
          ...user.toObject(),
          role: "host", // Assign 'host' if the user is the session host
        };
      } else {
        return {
          ...user.toObject(),
          role: "user", // Assign 'joined' for other users in joinedusers array
        };
      }
    });

    // Map through awaitingusers and assign the 'awaiting' role
    const awaitingUsersWithRole = awaitingusers.map((user) => ({
      ...user.toObject(),
      role: "user", // All users in awaitingusers will get the 'awaiting' role
    }));

    const users = processUsers(joinedUsersWithRole, awaitingUsersWithRole);

    let userIds = users
    .filter(user => user._id.toString() !== req.user.id.toString()) // Filter out the current user's ID
    .map(user => user._id); // Map to extract the remaining user IDs
    console.log("this is userId>>>>>", userIds)  
    const data = { users, updates, foundSession };

    for (const session_user of userIds) {
      sessionUpdates(user = session_user, (session = foundSession._id), data);
    }

    generateResponse(
      { session: foundSession },
      "User left successfully from session",
      res
    );
  } catch (error) {
    // Forward error to error-handling middleware
    const statusCode = error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR;
    next({
      status: false,
      statusCode,
      message: error.message || "An unexpected error occurred",
    });
  }
};

exports.Endsession = async (req, res, next) => {
  try {
    const { sessionid } = parseBody(req.body);

    const sessionidValidation = sessionidValidator.validate({ sessionid });
    if (sessionidValidation.error) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: sessionidValidation.error.details[0].message,
      });
    }

    const foundSession = await findSessionbyid(sessionid);
    if (!foundSession) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "No session found for this session Id",
      });
    }

    const loggedInUserId = req.user.id;

    if (foundSession.user.toString() !== loggedInUserId) {
      return next({
        status: false,
        statusCode: STATUS_CODE.FORBIDDEN,
        message: "Only the session owner can end the session.",
      });
    }

    foundSession.sessionStatus = "completed";

    const userProfile = await finduserbyauthid({ authId: loggedInUserId });
    const update = `${userProfile?.firstName} ${userProfile?.lastName} has ended the session.`;
    foundSession.updates.push(update);

    await foundSession.save();

    const updates = foundSession.updates;
    const joinedusers = await findSessionusersbyid(foundSession._id);
    console.log('joinedUsers>>>',joinedusers);
    const awaitingusers = await findinvitedusersbyid(foundSession._id);
    const joinedUsersWithRole = joinedusers.map((user) => {
      if (foundSession.user._id.equals(user._id)) {
        return {
          ...user.toObject(),
          role: "host",
        };
      } else {
        return {
          ...user.toObject(),
          role: "user", 
        };
      }
    });
    const awaitingUsersWithRole = awaitingusers.map((user) => ({
      ...user.toObject(),
      role: "user",
    }));
    const users = processUsers(joinedUsersWithRole, awaitingUsersWithRole);
    console.log('Mapped Users>>>>>', users);
    let userIds = users.map(user => user._id);
    console.log('user IDs>>>>', userIds)
    const data = { users, updates, foundSession };
    for (const id of userIds) {
      console.log('User Id for ending session>>>', id);
      sessionUpdates(user = id, (session = foundSession._id), data);
    }

    generateResponse(
      { sessiondata: foundSession },
      "Session ended and status set to completed",
      res
    );
  } catch (error) {
    const statusCode = error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR;
    const message = error.message || "An internal server error occurred";
    next({
      status: false,
      statusCode: statusCode,
      message: message,
    });
  }
};

//done and tested
exports.startSession = async (req, res, next) => {
  try {
    const { sessionid } = parseBody(req.body);

    const sessionidValidation = sessionidValidator.validate({ sessionid });
    const loggedInUserId = req.user.id;
    if (sessionidValidation.error) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: sessionidValidation.error.details[0].message,
      });
    }

    const foundSession = await findSessionbyid(sessionid);

    if (!foundSession) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "No session found for this session ID.",
      });
    }

    foundSession.sessionStatus = "started";
    const updateSession = await updateSessionById(sessionid, foundSession);

    const userProfile = await finduserbyauthid({ authId: loggedInUserId });
    const update = `${userProfile?.firstName} ${userProfile?.lastName} has started the session.`;
    foundSession.updates.push(update);

    await foundSession.save();

    const updates = foundSession.updates;
    const joinedusers = await findSessionusersbyid(foundSession._id);
    const awaitingusers = await findinvitedusersbyid(foundSession._id);
    const joinedUsersWithRole = joinedusers.map((user) => {
      if (foundSession.user._id.equals(user._id)) {
        return {
          ...user.toObject(),
          role: "host", // Assign 'host' if the user is the session host
        };
      } else {
        return {
          ...user.toObject(),
          role: "user", // Assign 'joined' for other users in joinedusers array
        };
      }
    });

    // Map through awaitingusers and assign the 'awaiting' role
    const awaitingUsersWithRole = awaitingusers.map((user) => ({
      ...user.toObject(),
      role: "user", // All users in awaitingusers will get the 'awaiting' role
    }));

    const users = processUsers(joinedUsersWithRole, awaitingUsersWithRole);
    let userIds = users.map(user => user._id);

    const data = { users, updates, foundSession };

    for (const id of userIds) {
      sessionUpdates(user = id, (session = foundSession._id), data);

    }

    generateResponse(
      { session: foundSession },
      "Session started successfully",
      res
    );
  } catch (error) {
    const statusCode = error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR;
    const message = error.message || "An internal server error occurred.";
    next({
      status: false,
      statusCode,
      message,
    });
  }
};

//doene and tested
exports.getMyJoinedSessions = async (req, res, next) => {
  try {
    const userid = req?.user?.id;

    const sessions = await findJoinedSession({
      sessionusers: userid,
      user: { $ne: userid },
    });

    if (sessions.length === 0) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "No joined sessions found",
      });
    }

    const sessionsWithDetails = sessions.map((session) => ({
      _id: session._id,
      sessionName: session.sessionName,
      totalMembers: session.sessionusers.length,
      createdAt: session.createdAt,
    }));

    generateResponse(
      { sessions: sessionsWithDetails },
      "Sessions fetched successfully",
      res
    );
  } catch (error) {
    next({
      status: false,
      statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
      message: error.message,
    });
  }
};

//done and tested
exports.sendInvitation = async (req, res, next) => {
  try {
    const { userId, sessionid } = parseBody(req.body);

    const sessionidValidation = sessionidValidator.validate({ sessionid });
    if (sessionidValidation.error) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: sessionidValidation.error.details[0].message,
      });
    }

    if (!Array.isArray(userId) || userId.length === 0) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "userIds should be a non-empty array.",
      });
    }

    for (let id of userId) {
      const userIdValidation = useridValidator.validate({ userId: id });
      if (userIdValidation.error) {
        return next({
          status: false,
          statusCode: STATUS_CODE.BAD_REQUEST,
          message: userIdValidation.error.details[0].message,
        });
      }
    }

    const foundSession = await findSessionbyid(sessionid);
    if (!foundSession) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "No session found for this session Id",
      });
    }

    const loggedInUserId = req.user.id;
    if (loggedInUserId !== foundSession.user.toString()) {
      return next({
        status: false,
        statusCode: STATUS_CODE.FORBIDDEN,
        message: "Only the host can send invitations.",
      });
    }

    let invitedUserSchema = await findInvitedUserSchemabySessionId(sessionid);
    if (!invitedUserSchema) {
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "No invitation schema found for this session.",
      });
    }
    let updates = foundSession.updates;

    let joinedusers = await findSessionusersbyid(foundSession._id);
    let awaitingusers = await findinvitedusersbyid(foundSession._id);

    let joinedUsersWithRole = joinedusers.map((user) => {
      if (foundSession.user._id.equals(user._id)) {
        return {
          ...user.toObject(),
          role: "host", // Assign 'host' if the user is the session host
        };
      } else {
        return {
          ...user.toObject(),
          role: "user", // Assign 'joined' for other users in joinedusers array
        };
      }
    });

    // Map through awaitingusers and assign the 'awaiting' role
    let awaitingUsersWithRole = awaitingusers.map((user) => ({
      ...user.toObject(),
      role: "user", // All users in awaitingusers will get the 'awaiting' role
    }));
    let users = processUsers(joinedUsersWithRole, awaitingUsersWithRole);
    let userIds = users.map(user => user._id);

    let data = { users, updates, foundSession };

    for (const id of userIds) {
      sessionUpdates(user = id, (session = foundSession._id), data);

    }

    const successfullyInvited = [];

    for (let user of userId) {
      const userAlreadyInSession = users.find((u) => u._id.toString() === user);
      if (userAlreadyInSession) {
        continue;
      }

      // Add userId to the invitedUserSchema
      invitedUserSchema.invitedUser.push(userId);
      successfullyInvited.push(userId);
    }

    await invitedUserSchema.save();
    updates = foundSession.updates;
    joinedusers = await findSessionusersbyid(foundSession._id);
    awaitingusers = await findinvitedusersbyid(foundSession._id);

     joinedUsersWithRole = joinedusers.map((user) => {
      if (foundSession.user._id.equals(user._id)) {
        return {
          ...user.toObject(),
          role: "host", // Assign 'host' if the user is the session host
        };
      } else {
        return {
          ...user.toObject(),
          role: "user", // Assign 'joined' for other users in joinedusers array
        };
      }
    });

    // Map through awaitingusers and assign the 'awaiting' role
     awaitingUsersWithRole = awaitingusers.map((user) => ({
      ...user.toObject(),
      role: "user", // All users in awaitingusers will get the 'awaiting' role
    }));
     users = processUsers(joinedUsersWithRole, awaitingUsersWithRole);
     userIds = users.map(user => user._id);
    data = { users, updates, foundSession };
    console.log("this is the data>>>>>>>>>>>>>>>>>>>>>>", foundSession._id);
    for (const id of userIds) {
      sessionUpdates(user = id, (session = foundSession._id), data);

    }
    if (successfullyInvited.length === 0) {
      return next({
        status: false,
        statusCode: STATUS_CODE.CONFLICT,
        message:
          "All users have already joined or have been invited to this session.",
      });
    }

    //need here socket

    const sender = req.user;
    const receiverIds = successfullyInvited;
    const type = NOTIFICATION_TYPE.SESSION_REQUEST;
    const sourceId = foundSession._id;
    const relatedId = req.user;
    const relatedType = NOTIFICATION_RELATED_TYPE.SESSION;
    const sessionName = foundSession.sessionName;
    const sessionCode = foundSession.sessionCode;
    const competition = {
      sessionName,
      sessionCode,
    };

    const n = await createAndSendNotification({
      senderObject: sender,
      receiverIds: receiverIds,
      type: type,
      sourceId: sourceId,
      relatedId: relatedId,
      relatedType: relatedType,
      competition,
    });
    // Generate success response
    for (const user of userId) {
      await user_notification_count({ userId: user });
    }
    generateResponse(invitedUserSchema, "User invited successfully.", res);
  } catch (error) {
    // Handle errors
    const statusCode = error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR;
    const message = error.message || "An internal server error occurred";
    next({
      status: false,
      statusCode: statusCode,
      message: message,
    });
  }
};


