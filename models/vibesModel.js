const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const vibesSchema = new Schema(
  {
    vibesName: { type: String, unique: true, required: true, lowercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// index for location
vibesSchema.index({ location: "2dsphere" });

// add pagination plugin
vibesSchema.plugin(mongoosePaginate);
vibesSchema.plugin(aggregatePaginate);

const vibesModel = model("vibes", vibesSchema);

exports.createVibesQuery = (obj) => vibesModel.create(obj);

//get all Vibes
exports.getVibes = (query) => vibesModel.find(query);



