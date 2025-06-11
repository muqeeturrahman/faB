const mongoose = require('mongoose');
const { Schema } = mongoose;

const inviteSchema = new Schema({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'session',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  invitedUser: [
    {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    }
  ]
}, {
  timestamps: true
});

inviteduserModel = mongoose.model('invite', inviteSchema);

exports.deleteinvitedusersbyid=(id)=>inviteduserModel.deleteOne({sessionId:id});
exports.createInvitedUsersObj=(obj)=>inviteduserModel.create(obj)
exports.findInvitedUserSchemabySessionId=(id)=>inviteduserModel.findOne({sessionId:id});
exports.findinvitedusersbyid = async (id) => {
    const invited = await inviteduserModel
      .findOne({ sessionId: id })
      .select("invitedUser")
      .populate({
        path: 'invitedUser',
        select: 'profileId',
        populate: {
          path: 'profileId',
          select: 'firstName lastName profileImage',
          populate: {
            path: 'profileImage',
          }
        }
      });

    if (!invited || !invited.invitedUser) {
      return []; 
    }
    return Array.isArray(invited.invitedUser) ? invited.invitedUser : [invited.invitedUser];
};


