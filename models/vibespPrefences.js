const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const PrefenceSchema = new Schema(
  {
    prefenceName: { type: String, unique: true, required: true, lowercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// index for location
PrefenceSchema.index({ location: "2dsphere" });

// add pagination plugin
PrefenceSchema.plugin(mongoosePaginate);
PrefenceSchema.plugin(aggregatePaginate);

const PrefenceModel = model("prefences", PrefenceSchema);

exports.createPrefenceQuery = (obj) => PrefenceModel.create(obj);

//get all Vibes
exports.getPrefenceQuery = (query) => PrefenceModel.find(query);



