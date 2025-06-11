const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { sign } = require("jsonwebtoken");

const profileOrgSchema = new Schema(
  {
    bussinessName: { type: String, required: true, minlength: 5 },
    bussinessCategory: { type: String, required: true },
    firstName: { type: String,  lowercase: true },
    lastName: { type: String },
    bussinessDescription: { type: String, required: true },
    gender: {
      type: String,
      trim: true,
      enum: ["male", "female", null, ""],
      default: null,
    },
 
    longitude: { type: Number, required: true },
    latitude: { type: Number, required: true },
    profileImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },
    openTime: { type: String, required: true }, // Assuming openTime is stored as a string in HH:mm format
    closeTime: { type: String, required: true }, // Assuming closeTime is stored as a string in HH:mm format
    location: {
      type: { type: String },
      coordinates: [Number],
    },
    portfolio: [
      {
        type: Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      
    ],
    address:{
      type:String,
      default : ""
    },
    __v: { type: Number, select: false },
  },
  { timestamps: true }
);

// index for location
profileOrgSchema.index({ location: "2dsphere" });

// add pagination plugin
profileOrgSchema.plugin(mongoosePaginate);
profileOrgSchema.plugin(aggregatePaginate);

const ProfileorgModel = model("orgprofiles", profileOrgSchema);




// create new user
exports.createOrgProfile = (obj) => ProfileorgModel.create(obj);

exports.findOrginazation = (query) =>
  ProfileorgModel.findOne(query).populate({
    path: "profileId", // Populate profileId
    model: "userprofiles",
   
  });

  exports.updateOrgProfileById = (userId, obj) =>
    ProfileorgModel.findByIdAndUpdate(userId, obj, { new: true });


  exports.deleteportfilioOrgProfileById =(profileId, objectIdArray) =>  ProfileorgModel.findByIdAndUpdate(
    profileId,
    { $pull: { portfolio: { $in: objectIdArray } } },
    { new: true }
  );

  exports.updateportfilioOrgProfileById =(profileId, portfolioImage) =>  ProfileorgModel.findByIdAndUpdate(
    profileId,
    { $push: { portfolio: { $each: portfolioImage } } },
    { new: true }
  );


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
