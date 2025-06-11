const { generateResponse, parseBody } = require("../utils");
const { IsNotificationValidator } = require("../validations/userValidator");
const {
  STATUS_CODE,
  NOTIFICATION_TYPE,
  NOTIFICATION_RELATED_TYPE,
} = require("../utils/constants");
const { findService, getBookings } = require("../models/services.js");
const {
  createBooking,
  findBooking,
  findBookings,
  updateBooking,
} = require("../models/bookingModel");
const {
  convertTo24HourFormat,
  populateOptions,
} = require("../utils/helper.js");
const { getBookingsVendor } = require("../queries/service.js");
const {
  createBookingReview,
  ReviewCount,
} = require("../models/bookingReviewModel.js");
const { createReviewValidator } = require("../validations/userValidator.js");
const {
  createAndSendNotification1,
} = require("../models/notificationModel.js");
const { getFavorites } = require("../models/favorties.js");

exports.createBooking = async (req, res, next) => {
  try {
    const { serviceId, startTime, endTime, date } = req.body;
    const userId = req.user.id;
    const service = await findService({ _id: serviceId });
    const bookings = await findBooking({ service: serviceId, user: userId, status: "ongoing" });
    if (!service) {
      return next({
        data: {},
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Service not found",
      });
    }
    
    if (bookings) {
      return next({
        data: {},
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "you have already booked this event",
      });
    }


    // Parse service and booking time
      let booking = await createBooking({
        service: serviceId,
        startTime,
        endTime,
        date,
        user: userId,
      });


      await createAndSendNotification1({
        senderObject: req.user,
        receiverIds: [service.user],
        type: NOTIFICATION_TYPE.BOOKING_SCHEDULED,
        sourceId: serviceId,
        relatedType: NOTIFICATION_RELATED_TYPE.BOOKING,
      });

      generateResponse(booking, "service booked successfully", res);
    
  } catch (e) {
    next(e);
  }
};
exports.getBookings = async (req, res, next) => {
  try {
    const { status } = req?.query;
    let services = [];
    
    if (req?.user?.role === "organization") {
      let bookings = await getBookings(req?.user?.id, status);
      generateResponse(bookings, "bookings", res);
      return;
    }
    
    var populateOptionss = populateOptions("organization");
    let bookings = await findBookings({ user: req?.user?.id, status })
      .populate({
        path: "service",
        populate: [{ path: "media" }, populateOptionss],
      })
      .sort({ createdAt: -1 });

    for (const booking of bookings) {
      let service = booking?.service;

      // Ensuring to check if service is a Mongoose document
      let ser = {
        ...(service.toObject ? service.toObject() : service), // If service is a Mongoose model, convert it to a plain object
        date: booking.date,
        booking_id: booking?._id,
        cancellation_reason: booking?.cancellation_reason,
        cancellation_decription: booking?.cancellation_decription
      };

      services.push(ser);
    }

    // Add 'isFavourite' field
    for (const serv of services) {
      serv.isFavourite = true;
    }

    if (bookings.length > 0) {
      generateResponse(services, "Services added successfully", res); // Change this to services instead of bookings
      return;
    } else {
      generateResponse([], "Bookings not found", res);
      return;
    }
  } catch (e) {
    next(e);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const { bookingId, reason, description } = req.body;
    let checkbookings = await findBookings({ _id: bookingId })
    if(checkbookings.length === 0){
      return next({
        data: {},
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Booking not found",
      });
    }   
    const cancelBooking = await updateBooking(bookingId, {
      status: "cancelled",
      cancellation_reason: reason,
      cancellation_decription: description,
    });

    var populateOptionss = populateOptions("organization");
    let bookings = await findBookings({ _id: bookingId }).populate({
      path: "service",
      populate: [{ path: "media" }, populateOptionss],
    });

    
    if (req.user.role == "user") {
      await createAndSendNotification1({
        senderObject: req.user,
        receiverIds: [bookings[0]?.service?.user?._id],
        type: NOTIFICATION_TYPE.VENDOR_CANCEL_BOOKING,
        sourceId: bookings[0]?.service?._id,
        relatedType: NOTIFICATION_RELATED_TYPE.BOOKING,
      });
    }

    if (req.user.role == "organization") {
      await createAndSendNotification1({
        senderObject: req.user,
        receiverIds: [bookings[0]?.user?._id],
        type: NOTIFICATION_TYPE.USER_CANCEL_BOOKING,
        sourceId: bookings[0]?.service?._id,
        relatedType: NOTIFICATION_RELATED_TYPE.BOOKING,
      }); 

    }
    generateResponse(bookings, "Your booking is cancelled", res);
  } catch (e) {
    next(e);
  }
};
exports.createBookingReview = async (req, res, next) => {
  try {
    const { review, rating, ambiance, sourceId } = req.body;
    const { error } = createReviewValidator.validate(req.body);

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
    let count = await ReviewCount({ user: req.user.id, sourceId });
    console.log(count, "count");
    if (count > 4) {
      generateResponse({}, "you have reviewd 5 times on this service", res);
      return;
    }
    const createReview = await createBookingReview({
      user: req.user.id,
      rating,
      ambiance,
      review,
      sourceId,
    });

    generateResponse(createReview, "review", res);
    return;
  } catch (e) {
    next(e);
  }
};
