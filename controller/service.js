const {
  createService,
  updateService,
  findService,
  findServices,
  deleteService,
  searchService,
  filter,
} = require("../models/services");
const { findVerifiedVendors, findVerifiedVendor } = require("../models/user");
const { SERVICE_STATUS } = require("../utils/constants");
const { createMedia, deleteMediaByIds } = require("../models/media");
const { generateResponse, parseBody } = require("../utils");
const { Types } = require("mongoose");
const { STATUS_CODE } = require("../utils/constants");
const { getRandomElement, getPreviousWeekDates } = require("../utils/helper");
const { populate } = require("dotenv");
const {
  createclickCount,
  findclickCount,
  findclickCounts,
} = require("../models/clickCountServiceModel");
const { findBookings, bookingCount } = require("../models/bookingModel");
const { findBookingsReview } = require("../models/bookingReviewModel");
const { findUsermood } = require("../models/userMood");
const {
  getfavoriteslist,
  getfavorites,getFavorites,
  updateFavorites,
  getFavourites,
  getfavoritess
  
} = require("../models/favorties.js");
const { idValidator } = require("../validations/sessionValidator");
const {findBooking} = require("../models/bookingModel.js")

exports.createService = async (req, res, next) => {
  try {
    const {
      title,
      activity_type,
      description,
      longitude,
      latitude,
      address,
      startingDate,
      endingDate,
      budget,
      vibes,
      time,
      place,
      preferences,
      type
    } = parseBody(req.body);

    const userId = req.user.id; // Assuming user ID is available in the request object
    let body = {
      title,
      activity_type,
      description,
      startingDate,
      endingDate,
      address,
      budget,
      user: userId,
      media: [],
      vibes,
      time,
      place,
      preferences,
      type
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
          file: element.key,
          fileType: "Image", // Assuming award images are always images
          userId: userId,
        });
        media.push(newMedia._id);
      }
      body.media = media;
    }

    let service = await createService(body);
    // let services = await findService({_id: service._id})

    if (service) {
      let Service;
      if (req.user.role === "organization") {
        Service = await findService({ _id: service._id })
          .populate({ path: "media" })
          .populate("preferences")
          .populate("vibes")
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
        Service = await findService({ _id: service._id })
          .populate({ path: "media" })
          .populate("preferences")
          .populate("vibes")
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
      generateResponse(Service, "Service created successfull", res);
    }
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.updateService = async (req, res, next) => {
  try {
    let {
      ServiceId,
      deletedImagesIds,
      title,
      activity_type,
      longitude,
      latitude,
      description,
      address,
      startingDate,
      endingDate,
      budget,
      vibes,
      time,
      place,
      preferences,
      type
    } = parseBody(req.body);

    let body = {};

    let Booking = await findBooking({service: ServiceId})
    if(Booking){
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Cannot Update Service Due To On Going Bookings!",
      });
    }
    if (deletedImagesIds && deletedImagesIds.length > 0) {
      await deleteMediaByIds(deletedImagesIds);
      await updateService(ServiceId, {
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
          file: element.key,
          fileType: "Image", // Assuming award images are always images
          userId: req.user.id,
        });
        media.push(newMedia._id);
      }
      await updateService(ServiceId, { $push: { media: media } });

      // body.media = media;
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

    if (address) {
      body.address = address;
    }
    if (title) {
      body.title = title;
    }
    if (activity_type) {
      body.activity_type = activity_type;
    }
    if (description) {
      body.description = description;
    }
    if (startingDate) {
      body.startingDate = startingDate;
    }
    if (endingDate) {
      body.endingDate = endingDate;
    }
    if (budget) {
      body.budget = budget;
    }
    if(vibes.length > 0){
      body.vibes = vibes
    }
    if(preferences.length > 0){
      body.preferences = preferences
    }
    if(time){
      body.time = time
    }
    if(place){
      body.place = place
    }
    if(type){
      body.type = type
    }

    let UpdatedService = await updateService(ServiceId, body);

    if (UpdatedService) {
      // let services = await findService({_id: UpdatedService._id})

      let Service;
      if (req.user.role === "organization") {
        Service = await findService({ _id: UpdatedService._id })
          .populate({ path: "media" })
          .populate("preferences")
          .populate("vibes")
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
        Service = await findService({ _id: UpdatedService._id })
          .populate({ path: "media" })
          .populate("preferences")
          .populate("vibes")
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
      generateResponse(Service, "Service updated successfully", res);

      // generateResponse(services, "service updated successfully", res)
    }
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.getUserServices = async (req, res, next) => {
  try {
    // let services = await findServices({user: req.user.id})

    let Service;

    if (req.user.role === "organization") {
      Service = await findServices({ user: req.user.id })
        .populate({ path: "media" })
        .populate("preferences")
        .populate("vibes")
        .populate({
          path: "user",
          populate: {
            path: "profileId", // Specify the fields you want to populate
            model: "orgprofiles",
            populate: {
              path: "profileImage portfolio",
            },
          },
        })
        .sort({ createdAt: -1 });
    } else {
      Service = await findServices({ user: req.user.id })
        .populate({ path: "media" })
        .populate("preferences")
        .populate("vibes")
        .populate({
          path: "user",
          populate: {
            path: "profileId", // Specify the fields you want to populate
            model: "userprofiles",
            populate: {
              path: "profileImage",
            },
          },
        })
        .sort({ createdAt: -1 });
    }

    let averageRating;
    let service = await Promise.all(
      Service.map(async (e) => {
        const reviews = await findBookingsReview({ sourceId: e._id });
        const favorite = await getFavorites(e._id , req.user.id)

        if (reviews.length > 0) {
          let totalRatings = reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          averageRating = totalRatings / reviews.length;
        } else {
          averageRating = 0;
        }
        let obj = e.toObject();
        obj.averageRating = averageRating;
        if(favorite.length > 0) {
          obj.isFavourite = true;

        }
        else{
          obj.isFavourite = false;

        }
        return obj;
      })
    );

    generateResponse(service, "service retrieved successfully", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.fetchServices = async (req, res, next) => {
  const { q } = req.body;
  const userId = req.user.id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  console.log("this is text overall", q);
  try {
    const users = await searchService({ page, limit, userId, q });
    generateResponse(users, "Property listed successfully", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.deleteService = async (req, res, next) => {
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
    let data = await deleteService(id);
    if (data.deletedCount === 0) {
      return next({
        data: { status: false },
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "something went wrong",
      });
    }
    if (data.deletedCount > 0) {
      generateResponse({}, "service deleted successfully", res);
    }
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.getServiceForHomeScreen = async (req, res, next) => {
  try {
    const { status } = req.body;
    let verifiedVendors = await findVerifiedVendors({ isSubscribed: true });
    // let unverifiedVendors = await findVerifiedVendors({isSubscribed: false});

    // console.log("this is the service ids>>>>>>>>>>>>>>>>>>>>>>>>>>>", verifiedVendors)

    // //this is more clean and consize as per my skills ....
    const vendorIds = Array.from(
      new Set(verifiedVendors.map((vendor) => vendor._id))
    );
    // const unverifiedVendorsIds = Array.from(new Set(
    //   unverifiedVendors
    //     .map(vendor => vendor._id)
    // ));
    // const query = status
    // ? { activity_type: status, user: { $in: unverifiedVendorsIds } }
    // : { user: { $in: unverifiedVendorsIds } };
    // const populateOptions = {
    //   path: "user",
    //   populate: {
    //     path: "profileId",
    //     model: "orgProfiles",
    //     populate: {
    //       path: "profileImage",
    //     },
    //   },
    // };

    // console.log("this is the service id", vendorIds);

    const query = {
      user: { $in: vendorIds },
    };

    if (status) {
      query.activity_type = status;
    }

    let Service = await findServices(query);
    Service = Service.map((e) => {
      let obj = e.toObject();
      obj.recommended = true;
      return obj;
    });

    if (Service.length === 0) {
      return generateResponse([], "No services found", res);
    }

    let randomService = getRandomElement(Service);

    // let recommended = {
    //   randomService,
    // }
    // const services = await findServices(query)
    //   .populate(populateOptions)
    //   .populate("media");

    // let AllServices = {
    //   services,
    //   randomService:[randomService]
    // }

    // let recommendedService = {
    //   location: randomService.location,
    //   _id: randomService._id,
    //   title: randomService.title,
    //   user: randomService.user,
    //   activity_type: randomService.activity_type,
    //   description: randomService.description,
    //   address: randomService.address,
    //   startingDate: randomService.startingDate,
    //   endingDate: randomService.endingDate,
    //   budget: randomService.budget,
    //   media: randomService.media,
    //   clicksCount: randomService.clicksCount,
    //   impressionCount: randomService.impressionCount,
    //   status: randomService.status,
    //   createdAt: randomService.createdAt,
    //   updatedAt: randomService.updatedAt,
    //   recommended: true
    // }
    // services.unshift(recommendedService)

    const reviews = await findBookingsReview({ sourceId: randomService._id });
    const favorite = await getFavorites(randomService._id , req.user.id)

    if(favorite.length > 0){
      randomService.isFavourite = true
    }
    else{
      randomService.isFavourite = false

    }
    let averageRating;
    if (reviews.length > 0) {
      let totoalRatings = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      averageRating = totoalRatings / reviews.length;
    } else {
      averageRating = 0;
    }
    randomService.averageRating = averageRating;
    
    let serviceid = []
    serviceid.push(randomService)
    generateResponse(serviceid, "Services Fetched Successfully", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.filerServices = async (req, res, next) => {
  try {
    const {
      activity_type,
      latitude,
      longitude,
      address,
      status,
      rating,
      startingDate,
      endingDate,
    } = req.body;

    let matchConditions = {
      ...(activity_type && { activity_type }),
      ...(latitude && { latitude }),
      ...(address && { address: { $regex: address, $options: "i" } }),
      ...(status && { status }),
      ...(longitude &&
        latitude && {
          coordinates: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
        }),
      ...(startingDate && { startingDate }),
      ...(endingDate && { endingDate }),
    };

    let services = await filter(matchConditions, rating);
    for (const service of services) {

      const favorite = await getFavorites(service._id , req.user.id)
      if(favorite.length > 0){
        service.isFavourite = true
      }
      else{
        service.isFavourite = false
      }
    }
    let randomService = getRandomElement(services);

    generateResponse(services, "Services Filtered Successfully", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.getService = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log("serviceId>>>>>", id);

    const service = await findclickCount({ service: id, user: req.user.id });
    if (service) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "you have already viewed this service",
      });
    }

    const date = new Date();
    let today = date.getDay();
    console.log(today);
    let day;
    switch (today) {
      case 0:
        day = "Sunday";
        break;
      case 1:
        day = "Monday";
        break;
      case 2:
        day = "Tuesday";
        break;
      case 3:
        day = "Wednesday";
        break;
      case 4:
        day = "Thursday";
        break;
      case 5:
        day = "Friday";
        break;
      case 6:
        day = "Saturday";
        break;

      default:
        day = null;
        break;
    }
    if (!day) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "day not found",
      });
    }

    const clicksCount = await createclickCount({
      service: id,
      day: day,
      user: req.user.id,
      date: date.toDateString(),
    });
    generateResponse(clicksCount, "clickCount updated", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.getAllTheVerifiedService = async (req, res, next) => {
  try {
    // get all verified vendors
    let verifiedVendors = await findVerifiedVendors({ isSubscribed: true });
    let unverifiedVendors = await findVerifiedVendors({ isSubscribed: false });
    const usermoods = await findUsermood({ authId: req.user.id });
    let vibes = Array.from(
      new Set(usermoods.moodVibes.map((e) => e.vibesName))
    );
    console.log("vibes", vibes);

    //this is more clean and consize as per my skills ....
    const vendorIds = Array.from(
      new Set(verifiedVendors.map((vendor) => vendor._id))
    );
    const unverifiedVendorsIds = Array.from(
      new Set(unverifiedVendors.map((vendor) => vendor._id))
    );

    let Service = await findServices({
      user: { $in: vendorIds },
      activity_type: { $in: vibes },
    });
    let unverifiedServices = await findServices({
      user: { $in: unverifiedVendorsIds },
      activity_type: { $in: vibes },
    });

    Service = Service.map((e) => {
      e = e.toObject();
      e.isRecommended = true;
      return e;
    });

    unverifiedServices.map((e) => Service.push(e));
    console.log(Service);
    if (Service.length === 0) {
      return generateResponse([], "No services found", res);
    }
    generateResponse(Service, "recommended service is fetched", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.serviceAnalytics = async (req, res, next) => {
  try {
    const service = await findServices({ user: req.user.id });
    const servicesCount = service.length;
    console.log(servicesCount);

    let serviceIds = Array.from(new Set(service.map((e) => e._id)));
    let weekDates = getPreviousWeekDates();
    console.log(weekDates);
    console.log("serviceIds>>>>", serviceIds);

    const clicks = await findclickCounts(serviceIds, weekDates);
    const bookingsCount = await bookingCount(serviceIds);

    let MonCount = 0;
    let TueCount = 0;
    let WedCount = 0;
    let ThuCount = 0;
    let FriCount = 0;
    let SatCount = 0;
    let SunCount = 0;

    if (clicks.length > 0) {
      clicks.map((e) => {
        switch (e.day) {
          case "Sunday":
            SunCount += 1;
            break;
          case "Monday":
            MonCount += 1;
            break;
          case "Tuesday":
            TueCount += 1;
            break;
          case "Wednesday":
            WedCount += 1;
            break;
          case "Thursday":
            ThuCount += 1;
            break;
          case "Friday":
            FriCount += 1;
            break;
          case "Saturday":
            SatCount += 1;
            break;

          default:
            day = null;
            break;
        }
      });
    }
    const clickCounts = {
      MonCount,
      TueCount,
      WedCount,
      ThuCount,
      FriCount,
      SatCount,
      SunCount,
      servicesCount,
      bookingsCount,
    };
    generateResponse(clickCounts, "serviceAnalytics", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.favoriteServiceToggle = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { serviceId } = body;

    // Validate the serviceId
    const serviceidValidation = idValidator.validate({ id: serviceId });
    if (serviceidValidation.error) {
      const error = new Error(serviceidValidation.error.details[0].message);
      error.statusCode = STATUS_CODE.BAD_REQUEST;
      throw error;
    }

    // Check if the service exists
    const isServiceExist = await findServices({ _id: serviceId });
    if (!isServiceExist) {
      const error = new Error("Service not found!");
      error.statusCode = STATUS_CODE.NOT_FOUND;
      throw error;
    }

    // Get the logged-in user's ID
    let userId = req.user.id;

    // Retrieve the user's favorites
    const favoritesData = await getfavoritess(userId);

    let updateQuery;
    let message;
    console.log(favoritesData)
    // Toggle favorite: if not in favorites, add it; otherwise, remove it
    if (favoritesData?.serviceid.indexOf(serviceId) === -1) {
      updateQuery = { $addToSet: { serviceid: serviceId } };
      message = "Service added to favorites successfully";
    } else {
      updateQuery = { $pull: { serviceid: serviceId } };
      message = "Service removed from favorites successfully";
    }

    // Update the user's favorites in the database
    const updatedFavorites = await updateFavorites(userId, updateQuery);

    // Return the response with updated favorites
    return generateResponse(
      { services: updatedFavorites?.serviceid},
      message,
      res
    );
  } catch (error) {
    const statusCode = error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR;
    next({
      status: false,
      statusCode,
      message: error.message,
    });
  }
};

exports.favoriteServicesList = async (req, res, next) => {
  // try {
  //   const userid = req.user.id;
  //   let favoriteServices = await getfavoriteslist(userid);
  //   let services= [];

  //   if (!favoriteServices || favoriteServices.length === 0) {
  //     const error = new Error("No favorite services found!");
  //     error.statusCode = STATUS_CODE.NOT_FOUND;
  //     throw error;
  //   }

  //   // favoriteServices = favoriteServices.map((e) => {
  //   //   let obj = e.toObject();
  //   //   obj.recommended = true;
  //   //   return obj;
  //   // });
  //   for (const service of favoriteServices) {
  //     services = service.serviceid;
  //   }

  //   generateResponse(
  //     { services },
  //     "Favorite services fetched successfully",
  //     res
  //   );
  //   for (const favorite of favoriteServices.serviceId) {
  //     const reviews = await findBookingsReview({ sourceId: favorite._id });
  //     let averageRating;

  //     if (reviews.length > 0) {
  //       let totalRatings = reviews.reduce(
  //         (sum, review) => sum + review.rating,
  //         0
  //       );
  //       averageRating = totalRatings / reviews.length;
  //     } else {
  //       averageRating = 0;
  //     }

  //     // Check if serviceid exists and is an object before attempting to convert it
  //     services = favorite.serviceId
      
  //     // Add averageRating to the serviceDetails object
  //     for (let val of services) {
  //       console.log(val);
  //       val.averageRating = averageRating; // Add averageRating inside serviceDetails
  //       console.log(val);
  //     }
  //   }

  //   // Send response with services array

  // } catch (error) {
  //   const statusCode = error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR;
  //   next({
  //     status: false,
  //     statusCode,
  //     message: error.message,
  //   });
  // }

  // const { q } = req.body;
  
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    const favourites = await getFavourites({ page, limit, userId });
    generateResponse(favourites, "Favourite list fetched successfully", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.getServiceForBooking = async (req, res, next) => {
  try {
    const { serviceId } = req.body;
    const userId = req.user.id;
    const reqService = await findServices({_id : serviceId});
    if(!reqService){
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "No service found!",
      });
    }
    generateResponse(reqService[0], "Service record found", res);
  } catch (error) {
    next(new Error(error.message));
  }
}