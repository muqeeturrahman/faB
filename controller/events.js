const { generateResponse, parseBody, generateRandomOTP } = require("../utils");
const {
  STATUS_CODE,
  USER_STATUS,
  EVENT_STATUS,
} = require("../utils/constants");


const {
  addEvent,
  getSingleEvent,
  getAllUserEvents,
  deleteAllUserEvents,
  deleteSingleEvent,
  updateEvent,
  updateEvents,
  getEventById,
} = require("../models/events");
const { findUser } = require("../models/user");
const { createMedia, deleteMediaByIds } = require("../models/media");
const { Types } = require("mongoose");
const {getReportedEventByMeIds} = require("../utils/helper")
exports.createEvent = async (req, res, next) => {
  try {
    let { title, date, time, longitude, latitude, ticket_url, description } =
      parseBody(req.body);

    const userId = req.user.id;

    let body = {
      title,
      date,
      time,
      ticket_url,
      description,
      user: userId,
      media: [],
    };

    if (longitude && latitude) {
      // Convert longitude and latitude to numbers
      let long = parseFloat(longitude);
      let lat = parseFloat(latitude);
      // Set location field as a geospatial point
      body.location = {
        type: "Point",
        coordinates: [long, lat],
      };
      // If location is provided as a string, set it directly
    }

    if (req.files && req.files.media && req.files.media.length) {
      let media = [];
      for (let index = 0; index < req.files.media.length; index++) {
        const element = req.files.media[index];
        let newMedia = await createMedia({
          file: element.filename,
          fileType: element.fileType, // Assuming award images are always images
          userId: userId,
        });
        media.push(newMedia._id);
      }
      body.media = media;
    }

    let Events = await addEvent(body);
    // let event = await getEventById(Event._id);

    if (Events) {
      let Event;
      if (req.user.role === "organization") {
        Event = await getSingleEvent({ _id: Events._id })
          .populate({ path: "media" })
          .populate({
            path: "user",
            populate: {
              path: "profileId", // Specify the fields you want to populate
              model: "orgprofiles",
              populate: {
                path: "profileImage portfolio",
              },
            },
          });
      } else {
        Event = await getSingleEvent({ _id: Events._id })
          .populate({ path: "media" })
          .populate({
            path: "user",
            populate: {
              path: "profileId", // Specify the fields you want to populate
              model: "userprofiles",
              populate: {
                path: "profileImage",
              },
            },
          });
      }
      generateResponse(
        Event,
        "Event Has Been Sent To Admin For Approval!",
        res
      );
    }
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    let {
      eventId,
      deletedImagesIds,
      title,
      date,
      time,
      longitude,
      latitude,
      ticket_url,
      description,
    } = parseBody(req.body);
    let body = {};


    let servicetofind = await getSingleEvent({ _id: eventId });

    if (!servicetofind) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Service to delete not found",
      });
    }
    if (deletedImagesIds && deletedImagesIds.length > 0) {
      await deleteMediaByIds(deletedImagesIds);
      await updateEvent(eventId, {
        $pull: {
          media: { $in: deletedImagesIds.map((id) => new Types.ObjectId(id)) },
        },
      });
    }

    if (req.files && req.files.media && req.files.media.length) {
      let media = [];
      for (let index = 0; index < req.files.media.length; index++) {
        const element = req.files.media[index];

        let newMedia = await createMedia({
          file: element.filename,
          fileType: "Image", // Assuming award images are always images
          userId: req.user.id,
        });

        media.push(newMedia._id);
      }
      // body.media = media;
      await updateEvent(eventId, {
        $push: {
          media: media,
        },
      });
    }

    if (longitude && latitude) {
      // Convert longitude and latitude to numbers
      let long = parseFloat(longitude);
      let lat = parseFloat(latitude);
      // Set location field as a geospatial point

      body.location = {
        type: "Point",
        coordinates: [long, lat],
      };
      // If location is provided as a string, set it directly
    }

    if (title) {
      body.title = title;
    }

    if (date) {
      body.date = date;
    }

    if (time) {
      body.time = time;
    }

    if (ticket_url) {
      body.ticket_url = ticket_url;
    }
    if (description) {
      body.description = description;
    }

    let UpdateEvent = await updateEvent(eventId, body);

    if (UpdateEvent) {
      let Event;
      if (req.user.role === "organization") {
        Event = await getSingleEvent({ _id: UpdateEvent._id })
          .populate({ path: "media" })
          .populate({
            path: "user",
            populate: {
              path: "profileId", // Specify the fields you want to populate
              model: "orgprofiles",
              populate: {
                path: "profileImage portfolio",
              },
            },
          });
      } else {
        Event = await getSingleEvent({ _id: UpdateEvent._id })
          .populate({ path: "media" })
          .populate({
            path: "user",
            populate: {
              path: "profileId", // Specify the fields you want to populate
              model: "userprofiles",
              populate: {
                path: "profileImage",
              },
            },
          });
      }

      generateResponse(Event, "Event updated successfully", res);
    }
  } catch (error) {
    next(new Error(error.message));
  }
};

// exports.getUserEvents = async (req, res, next) => {
//   try {

//       let Event;
//       if(req.user.role === "organization"){
//         Event = await getAllUserEvents({ user: req.user._id }).populate({path:"media"}).populate({path:"user", populate:{
//           path: "profileId", // Specify the fields you want to populate
//           model: "orgprofiles", populate:{
//             path: "profileImage portfolio"
//           }
//         }});;
//       }
//       else {
//         Event = await getAllUserEvents({ user: req.user.id }).populate({path:"media"}).populate({path:"user", populate:{
//           path: "profileId", // Specify the fields you want to populate
//           model: "userprofiles", populate:{
//             path: "profileImage"
//           }
//         }});;
//       }
//     generateResponse(Event, "Events retrieved successfully", res);

//     // generateResponse(Events, "Events retrieved successfully", res)
//   } catch (error) {
//     next(new Error(error.message));
//   }
// };

exports.getUserEvents = async (req, res, next) => {
  try {
    const { status } = req.query;
    let ReportedEventIds = await getReportedEventByMeIds(req.user.id);
    let eventsQuery;

    console.log("this is reported Events Ids>>>>>>", ReportedEventIds)

    // const update=await updateEvents({},{})
    const populateOptions = [
      { path: "media" },
      {
        path: "user",
        select:
          "email role isActive isVerified isCompleted deviceTokens online isNotification profileId profileModel",
      },
    ];

    switch (status) {
      case USER_STATUS.ALLEVENTS:
        eventsQuery = getAllUserEvents({
          _id: { $nin: ReportedEventIds }, // Exclude events with IDs in ReportedEventIds
          user: { $ne: req.user.id }, // User is not the current user
          completion_status: { $ne: EVENT_STATUS.COMPLETED } // Event status is not COMPLETED
        });

        break;

      case USER_STATUS.COMPLETED:
        eventsQuery = getAllUserEvents({
          _id: { $nin: ReportedEventIds }, // Exclude events with IDs in ReportedEventIds
          completion_status: EVENT_STATUS.COMPLETED,
        });
        break;

      case USER_STATUS.MYEVENTS:
        eventsQuery = getAllUserEvents({  _id: { $nin: ReportedEventIds }, // Exclude events with IDs in ReportedEventIds
          user: req.user.id, completion_status: { $ne: EVENT_STATUS.COMPLETED } });
        break;

      case USER_STATUS.OTHERSEVENTS:
        eventsQuery = getAllUserEvents({
          _id: { $nin: ReportedEventIds }, // Exclude events with IDs in ReportedEventIds
          user: { $ne: req.user.id }, // User is not the current user
          completion_status: { $ne: EVENT_STATUS.COMPLETED } // Event status is not COMPLETED
        });
        break;

      default:
        return res.status(400).json({ message: "Invalid status" });
    }

    const events = await eventsQuery.populate(populateOptions).sort({createdAt:-1});
    let profilePopulateOptions;
    // Populate profiles based on role
    const populatedEvents = await Promise.all(
      events.map(async (event) => {
        if ((event.user.role === "organization")) {
          profilePopulateOptions = {
            path: "profileId",
            model: "orgprofiles",
            populate: {
              path: "profileImage portfolio",
            },
          };

          event.user = await findUser({ _id: event.user._id }).populate(
            profilePopulateOptions
          );
        } else {
          profilePopulateOptions = {
            path: "profileId",
            model: "userprofiles",
            populate: {
              path: "profileImage",
            },
          };
          event.user = await findUser({ _id: event.user._id }).populate(
            profilePopulateOptions
          );
        }
        return event;
      })
    );

    generateResponse(populatedEvents, "Events retrieved successfully", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    let { id } = parseBody(req.body);
    // let service = await findService({_id: id})
    if (!id) {
      return next({
        data: { status: false },
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "id cannot be empty",
      });
    }
    let servicetofind = await getSingleEvent({ _id: id });
    if (!servicetofind) {
      return next({
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "event not found",
      });
    }
    let data = await deleteSingleEvent(id);
    if (data.deletedCount === 0) {
      return next({
        data: { status: false },
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Event not found, something went wrong",
      });
    }
    if (data.deletedCount > 0) {
      generateResponse({}, "Event deleted successfully", res);
    }
  } catch (error) {
    next(new Error(error.message));
  }
};
