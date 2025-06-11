const { Schema, model } = require("mongoose");
const { ROLES } = require("../utils/constants");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { sign } = require("jsonwebtoken");
const {populateOptions}=require('../utils/helper.js');
const {getUserQuery}=require('../queries/getuserquery.js');
const {getMongooseAggregatePaginatedData}=require("../utils/index.js")
const userSchema = new Schema(
  {
    email: { type: String,  required: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    isActive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    isSubscribed: {type: Boolean, default: false},
    deviceToken: { type: String, default: null },
    online: { type: Boolean, default: false },
    isNotification: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    online: { type: Boolean, default: true },
    __v: { type: Number, select: false },
    // profileId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "userprofiles",
    //   default: null,
    // },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'userprofiles',
      default: null,
    },

    
  },
  { timestamps: true }
);

// index for location
userSchema.index({ location: "2dsphere" });

// add pagination plugin
userSchema.plugin(mongoosePaginate);
userSchema.plugin(aggregatePaginate);

const UserModel = model("user", userSchema);

// create new user
exports.createUser = (obj) => UserModel.create(obj);
exports.getFcmTokens = async (userIds) => {
  // Query to find users with the specified userIds and project only the fcmToken field
  const usersWithFcmTokens = await UserModel.find({ _id: { $in: userIds } });

  // Extracting the fcmTokens
  const fcmTokens = usersWithFcmTokens.map(user => user.deviceToken);
  return fcmTokens;
}

exports.findUsers = (query) => UserModel.find(query).populate({
  path: "profileId", // Specify the fields you want to populate
  model: "userprofiles",
  populate: {
    path: "profileImage",
  },
});

exports.findUser = (query) => UserModel.findOne(query);
exports.finduserByid=(id)=>UserModel.findById(id);

exports.findVerifiedVendors = (query) => UserModel.find(query);



exports.findUser = (query) => UserModel.findOne(query);
exports.updateUsers = (query,obj) => UserModel.updateMany(query,obj);

exports.updateUserById = (userId, obj) =>
  UserModel.findByIdAndUpdate(userId, obj, { new: true });

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


exports.getUsers = async (role,page,limit) => {
  try {
    const query =  getUserQuery(role);
    const { data, pagination } = await getMongooseAggregatePaginatedData({
      model: UserModel, // Ensure you pass the correct model
      page,
      limit,
      query,
  });
    return { data: data, pagination };
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
};

exports.groupUsersByCriteria=async(criteria)=>{
  let aggregationPipeline;
  
  switch (criteria) {
    
    case 'role':
      aggregationPipeline = [
        {
          $group: {
            _id: "$role", 
            count: {$first:"$count"}
          }
        },
        {
          $sort: { count: -1 } 
        }
      ];
    }
    console.log()
    const results = await UserModel.aggregate(aggregationPipeline);
    return results;
}