const { Schema, model, Types } = require("mongoose");
const { ROLES } = require("../utils/constants");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require('../utils/index')
const { sign } = require("jsonwebtoken");
const { ref, required } = require("joi");
const { SERVICE_STATUS, CATEGORY,MOODVIBES, MOODLOCATION, GROUPESIZE } = require('../utils/constants');
const { populate } = require("dotenv");
const { searchServiceQuery, getBookingsVendor,filterServicesQuery,getAllServices} = require("../queries/service")
const serviceSchema = new Schema(
  {
    // add vibes, time, location, prefference
    title: { type: String, default: null },
    user: { type: Schema.Types.ObjectId, ref: "user", default: null, },
    activity_type: { type: String, enum: Object.values(CATEGORY), default: null },
    description: { type: String, default: null },
    location: { type: { type: String }, coordinates: [Number] },
    address: { type: String, default: null },
    startingDate: { type: String, required:true },
    endingDate: { type: String, required:true},
    budget: { type: String, default: null },
    media: [{ type: Schema.Types.ObjectId, ref: "Media", default: null }],
    clicksCount: { type: Schema.Types.Number, default: 0 },
    impressionCount: { type: Schema.Types.Number, default: 0 },
    status: { type: String, enum: Object.values(SERVICE_STATUS), default: SERVICE_STATUS.OPENED },
    vibes: [{type: Types.ObjectId, ref: "vibes"}],
    time: {type: String, default: null},
    place: {type: String, enum: Object.values(MOODLOCATION)},
    preferences: [{type: Types.ObjectId, ref: "prefences"}],
    type: {type: String, enum: Object.values(GROUPESIZE), default: null}

  },
  { timestamps: true }
);

// index for location
serviceSchema.index({ location: "2dsphere" });

// add pagination plugin
serviceSchema.plugin(mongoosePaginate);
serviceSchema.plugin(aggregatePaginate);

const ServiceModel = model("service", serviceSchema);

// create new user
exports.createService = (obj) => ServiceModel.create(obj)

exports.findService = (query) => ServiceModel.findOne(query)

exports.searchService = async ({ page, limit, userId, q }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: ServiceModel,
    query: searchServiceQuery(userId, q),
    page,
    limit,
  });
  return { result: data, pagination };
}

exports.findServices = (query) => ServiceModel.find(query).populate({path: "user", populate:{
  path: "profileId",
  model: "orgprofiles",
  populate:{
    path: "profileImage"
  }
}}).populate("media")


exports.updateService = (id, query) => ServiceModel.findByIdAndUpdate(id, query,{new:true})

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

exports.deleteService = (id) => ServiceModel.deleteOne({ _id: id })
exports.updateServices = (obj,query) => ServiceModel.updateMany(obj,query)
exports.getBookings = async (userId,status) => {

  let query = getBookingsVendor(userId,status)
  let data = await ServiceModel.aggregate(query)
  return data
  
}
// open when need pagination
// exports.filter = async (matchConditions, rating, page, limit) => {
//   // let query = filterServicesQuery(matchConditions, rating);

//   const { data, pagination } = await getMongooseAggregatePaginatedData({
//     model: ServiceModel,
//     query: filterServicesQuery(matchConditions, rating),
//     page,
//     limit,
//   });
//   return { result: data, pagination };
// };
exports.filter = async (matchConditions, rating) => {
  let query = filterServicesQuery(matchConditions, rating);
  let data = await ServiceModel.aggregate(query);
  return data;
};


exports.RecommendationSystem = async (vibesAndPrefferences) => {
  let query = getAllServices(vibesAndPrefferences);
  let data = await ServiceModel.aggregate(query);
  return data;
};


