
const { generateResponse, parseBody } = require("../utils");
const { STATUS_CODE } = require('../utils/constants')
const { createBookingReview, ReviewCount,findBookingsReview } = require("../models/bookingReviewModel.js")
const {createReviewValidator}=require("../validations/userValidator.js");
const { populateOptions } = require("../utils/helper.js");

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
      let count = await ReviewCount({ user: req.user.id, sourceId })
      console.log(count, "count");
      if (count > 4) {
        return next({
          statusCode: STATUS_CODE.BAD_REQUEST,
          staus: false,
          message: "you have reviewd 5 times on this service",
        });
      }
      const createReview = await createBookingReview({ user: req.user.id, rating, ambiance, review, sourceId })
  
      generateResponse(createReview, "review", res);


    }
    catch (e) {
      next(e);
    }
  }
  
exports.getReviews=async(req,res,next)=>{
  try{
  const {serviceId}=req.body;
  const reviews=await findBookingsReview({sourceId:serviceId})
  if(reviews.length>0){
   let totoalRatings=reviews.reduce((sum,review)=>sum +review.rating,0)
   let averageRating=totoalRatings/reviews.length

  generateResponse({reviews,averageRating}, "reviews", res);
  }
  else{
    return next({
      statusCode: STATUS_CODE.BAD_REQUEST,
      staus: false,
      message: "no reviews on this service",
    });
  }

  }
  catch(error){
    next(error);
  }
  }