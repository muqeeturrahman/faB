const mongoose = require('mongoose');
const { Schema } = mongoose;
const {getFavouriteList} = require("../queries/service")
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require('../utils/index');

const favoriteSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  serviceid: [
    {
      type: Schema.Types.ObjectId,
      ref: 'service',
      required: true
    }
  ]
}, {
  timestamps: true
});
favoriteSchema.plugin(mongoosePaginate);
favoriteSchema.plugin(aggregatePaginate);

const favoriteServiceModel = mongoose.model('favorite', favoriteSchema);

exports.getFavourites = async ({ page, limit, userId }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: favoriteServiceModel,
    query: getFavouriteList(userId),
    page,
    limit,
  });
  return { result: data, pagination };
}
 
exports.getfavoriteslist= (id) => favoriteServiceModel.find({userId:id}).populate({
  path: 'serviceid', 
  populate: {
    path: 'user', 
    populate: {
      path: 'profileId', 
      model: 'orgprofiles', 
      populate: {
        path: 'profileImage', 
        model: 'Media' 
      }
    },
    model: 'user' 
  }
})
.populate({
  path: 'serviceid', 
  populate: {
    path: 'media',
    model: 'Media' 
  }
}).select("serviceid -_id");

exports.getfavorites=(id)=>favoriteServiceModel.find({$in:{serviceid: id}}).select('serviceid');

exports.getfavoritess = (id) => favoriteServiceModel.findOne({
  userId: id
}).select('serviceid');

exports.updateFavorites = (userId, updateQuery) => favoriteServiceModel.findOneAndUpdate({ userId },updateQuery,{ new: true, upsert: true } );
  
exports.getFavorites=(serviceid, userId)=>favoriteServiceModel.find({serviceid ,userId});

