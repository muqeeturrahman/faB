const { Schema, model } = require("mongoose");

const bookingReviewSchema = new Schema(
  {
    rating: { type: Number, default: 0 },
    ambiance: { type: Number, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: "user", default: null, },
    review: { type: String,default :"" },
    sourceId: { type: Schema.Types.ObjectId, ref: "service", },

  },
  { timestamps: true }
);



// add pagination plugin


const bookingReviewModel = model("bookingReview", bookingReviewSchema);

// create new user
exports.createBookingReview = (obj) => bookingReviewModel.create(obj)
exports.ReviewCount = (obj) => bookingReviewModel.countDocuments(obj)

exports.findBookingReview  = (query) => bookingReviewModel.findOne(query)


exports.findBookingsReview  = (query) => bookingReviewModel.find(query).populate({
  path: "user",
  populate: {
    path: "profileId",
    model: "userprofiles",
    populate: {
      path: "profileImage",
    },
  },
})

exports.updateBookingReview  = (id, query) => bookingReviewModel.findByIdAndUpdate(id, query,{new:true})
// generate jwt token


exports.deleteReview  = (id) => bookingReviewModel.deleteOne({ _id: id })
