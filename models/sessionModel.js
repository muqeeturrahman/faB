const { Schema, model } = require("mongoose");
const {GROUPESIZE,MOODTTIME,MOODLOCATION,} = require("../utils/constants");
const { string } = require("joi");
const sessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  sessionName:{type:String,require:true},
  sessionCode:{type:String,require:true},
  sessionusers:[{
    type: Schema.Types.ObjectId,
    ref: 'user',
  }],
  sessionStatus: {
    type: String,
    enum: ['pending', 'started', 'completed'], 
    default: 'pending', 
  },
  updates:[{
    type:String
  }]
}, {
  timestamps: true
});

const sessionModel = model('session', sessionSchema);
exports.findSessionbyid=(id)=>sessionModel.findById(id);
exports.deleteSessionbyid=(id)=>sessionModel.deleteOne({_id:id});
exports.createSession=(obj)=>sessionModel.create(obj);
exports.findSession=(obj)=>sessionModel.findOne(obj);
exports.findSessionsByUserId=(id)=>sessionModel.find({user:id}).select("sessionName sessionusers createdAt");
exports.findSessionusersbyid = async (id) => {
    const session = await sessionModel
      .findById(id)
      .select("sessionusers")
      .populate({
        path: 'sessionusers',
        select: 'profileId',
        populate: {
          path: 'profileId',
          model: "userprofiles",
          select: 'firstName lastName profileImage',
          populate: {
            path: 'profileImage',
          }
        }
      });
    console.log('findSessionUsersByID>>>>', session.sessionusers);
    return Array.isArray(session.sessionusers) ? session.sessionusers : [session.sessionusers];

};
exports.updateSessionById = async (id, data) => sessionModel.updateOne({_id: id}, {$set: {data}} )

exports.findJoinedSession=(obj)=>sessionModel.find(obj);
