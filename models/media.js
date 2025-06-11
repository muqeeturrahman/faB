'use strict';

const { Schema, model, Types } = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");


const mediaSchema = new Schema({
  
    file: {
      type: String,
      required: true,
    },
    fileType: { type: String, enum: ["Image", "Video"], default: "Image" },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "userprofiles",
      require: true,
    },
  },
  {
    timestamps: true,
  },
);

// hide __v field at JSON response
mediaSchema.set("toJSON", {
  transform: function (doc, ret, opt) {
    if (ret["__v"]) delete ret["__v"];
    return ret;
  },
});

// add pagination plugin
mediaSchema.plugin(mongoosePaginate);
mediaSchema.plugin(aggregatePaginate);

const MediaModel = model("Media", mediaSchema);

// create new media
const createMedia = (obj) => MediaModel.create(obj);

// find media by id
exports.findMediaById = (mediaId) => MediaModel.findById(mediaId).lean();

// find all media
exports.findAllMedia = async ({ page, limit, query }) => {
  const { data, pagination } = await getMongoosePaginatedData({
    model: MediaModel,
    query,
    page,
    limit,
  });

  return { result: data, pagination };
}

const deleteMediaByIds = (ids) =>  MediaModel.deleteMany({ _id: { $in: ids } });

// update media by id
exports.updateMediaById = (mediaId, obj) => MediaModel.findByIdAndUpdate(mediaId, obj, { new: true });
module.exports = { MediaModel,createMedia, deleteMediaByIds };
