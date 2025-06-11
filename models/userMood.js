const { Schema, model } = require("mongoose");
const {
  ROLES,
  GROUPESIZE,
  MOODTTIME,
  MOODLOCATION,
} = require("../utils/constants");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const {getMongooseAggregatePaginatedData}=require("../utils/index.js")
const { sign } = require("jsonwebtoken");
const { required } = require("joi");
const {groupusers}=require("../queries/groupquery.js");
const userMoodSchema = new Schema(
  {
    groupSize: { type: String, enum: Object.values(GROUPESIZE) },
    groupParticipantNo: { type: Number, default: 0},
    moodDistance: { type: String, required: true },
    moodTime: { type: String, enum: Object.values(MOODTTIME) },
    moodLocation: { type: String, enum: Object.values(MOODLOCATION) },
    __v: { type: Number, select: false },
    authId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      default: null,
      required: true,
    },
    moodVibes: [
      {
        type: Schema.Types.ObjectId,
        ref: "vibes",
        default: null,
      },
    ],
    moodPrefernces: [
      {
        type: Schema.Types.ObjectId,
        ref: "prefences",
        default: null,
      },
    ],
  },
  { timestamps: true }
);

// index for location
userMoodSchema.index({ location: "2dsphere" });

// add pagination plugin
userMoodSchema.plugin(mongoosePaginate);
userMoodSchema.plugin(aggregatePaginate);

const MoodModel = model("usermoods", userMoodSchema);

exports.createOrUpdateUserMood = async (obj) => {
  try {
    const result = await MoodModel.findOneAndUpdate(
      { authId: obj.authId },
      obj,
      { new: true, upsert: true }
    );
    return result;
  } catch (error) {
    throw error;
  }
};

exports.findUsermood = (query) => MoodModel.findOne(query)  .populate({ path: 'moodVibes', model: 'vibes' })
.populate({ path: 'moodPrefernces', model: 'prefences' });


exports.getgroupUsers = async (matchConditions,page,limit) => {
  try {
    const groupbyquery=groupusers(matchConditions);
    const { data, pagination } = await getMongooseAggregatePaginatedData({
      model: MoodModel, 
      page,
      limit,
      query:groupbyquery,
  });
    return { data: data, pagination };
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
};
