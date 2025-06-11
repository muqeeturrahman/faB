const { Schema, model } = require("mongoose");
const { ROLES } = require("../utils/constants");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { sign } = require("jsonwebtoken");

const profileSchema = new Schema(
  {
    firstName: { type: String, required: true, lowercase: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    
    location: { type: { type: String }, coordinates: [Number] },
    gender: {
      type: String,
      trim: true,
      enum: ["male", "female", null, ""],
      default: null,
    },
    authId: { type: Schema.Types.ObjectId, ref: "user", default: null },
    profileImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },
    __v: { type: Number, select: false },
    address:{
      type:String,
      default : ""
    }
  },

  { timestamps: true }
);

// index for location
profileSchema.index({ location: "2dsphere" });

// add pagination plugin
profileSchema.plugin(mongoosePaginate);
profileSchema.plugin(aggregatePaginate);

const ProfileModel = model("userprofiles", profileSchema);

// create new user
exports.createUserProfile = (obj) => ProfileModel.create(obj);

exports.updateUserProfileById = (userId, obj) =>
  ProfileModel.findByIdAndUpdate(userId, obj, { new: true });

exports.finduserbyauthid=(query)=>ProfileModel.findOne(query);
exports.finduserbyname=(query)=>ProfileModel.find(query).select('firstName lastName authId').populate("profileImage")
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
