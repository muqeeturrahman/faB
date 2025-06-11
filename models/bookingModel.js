const { Schema, model } = require("mongoose");
const { ROLES } = require("../utils/constants");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require('../utils/index')
const { sign } = require("jsonwebtoken");
const { ref } = require("joi");
const { SERVICE_STATUS, MOODVIBES } = require('../utils/constants');
const { populate } = require("dotenv");
const { searchServiceQuery, getBookingsVendor } = require("../queries/service")
const bookingSchema = new Schema(
  {


    service: { type: Schema.Types.ObjectId, ref: "service", default: null, },
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
    user: { type: Schema.Types.ObjectId, ref: "user", default: null, },
    date: { type: Date, default: null },
    status: { type: String, enum: ["ongoing", "cancelled", "completed"], default: "ongoing" },
    cancellation_reason : {type: String, default: null },
    cancellation_decription: {type: String, default: null},

  },
  { timestamps: true }
);

// index for location
bookingSchema.index({ location: "2dsphere" });

// add pagination plugin
bookingSchema.plugin(mongoosePaginate);
bookingSchema.plugin(aggregatePaginate);

const bookingModel = model("booking", bookingSchema);

// create new user
exports.createBooking = (obj) => bookingModel.create(obj)

exports.findBooking = (query) => bookingModel.findOne(query)

exports.searchService = async ({ page, limit, userId, q }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: bookingModel,
    query: searchServiceQuery(userId, q),
    page,
    limit,
  });
  return { result: data, pagination };
}

exports.findBookings = (query) => bookingModel.find(query)

exports.updateBooking = (id, query) => bookingModel.findByIdAndUpdate(id, query,{new:true})
// generate jwt token
exports.generateToken = (user) => {

  const token = sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );
  return token;
};

exports.deleteService = (id) => bookingModel.deleteOne({ _id: id })
exports.bookingCount = (serviceIds) => bookingModel.countDocuments({service:{$in:serviceIds}})
