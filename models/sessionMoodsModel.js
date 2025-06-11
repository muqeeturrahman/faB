const { Schema, model } = require("mongoose");
const { GROUPESIZE, MOODTTIME, MOODLOCATION,MOODVIBES,MOODPREFERNCES} = require("../utils/constants");

const sessionMoodsSchema = new Schema({
  userid: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  session: {
    type: Schema.Types.ObjectId,
    ref: 'session',
    required: true
  },
  sessionVibes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'vibes', // Reference to the 'vibes' collection
      required: true
    }
  ],
  moodLocation: {
    type: String,
    enum: Object.values(MOODLOCATION), 
    required: true
  },
  sessionPreference: [
    {
      type:Schema.Types.ObjectId, 
      enum: 'prefences', 
      required: true
    }
  ],
  groupSize: {
    type: String,
    enum: Object.values(GROUPESIZE), 
    required: true
  },
  sessionDistance: {
    type: String,
    required: true
  },
  sessionTime: {
    type: String,
    enum: Object.values(MOODTTIME),
    required: true
  },
}, {
  timestamps: true
});

const sessionMoodsModel = model('sessionMoods', sessionMoodsSchema);

exports.createSessionMoods = (obj) => sessionMoodsModel.create(obj);
exports.findSessionMoods = (obj) => sessionMoodsModel.findOne(obj);
exports.findUsersSessionMoods = (obj) => sessionMoodsModel.find(obj).select("sessionVibes sessionPreference")
