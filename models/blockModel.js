

let { Schema, model } = require("mongoose");

const blockSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'user' },
    blockId: { type: Schema.Types.ObjectId, ref: 'user' },
}, { timestamps: true });

const BlockModel = model('block', blockSchema);

// add user to block
exports.blockUser = (obj) => BlockModel.create(obj);

// get all blocks
exports.getBlockList = (query) => BlockModel.find(query);

// find block
exports.findBlockUser = (query) => BlockModel.findOne(query);

// delete block
exports.unblockUser = (query) => BlockModel.deleteOne(query);

// get number of block users
exports.numBlockUsers = async (userId) => {
    const result = await BlockModel.aggregate([
        { $match: { userId: Types.ObjectId(userId) } },
        { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    return result.length > 0 ? result[0].count : 0;
};

// get blocked users
// exports.getBlockedUsers = async (userId) => {
//     const blockedUsers = await BlockModel.find({ blockId: userId }).distinct('userId');
//     return blockedUsers;
// };


exports.blockedUserIds = (query) => BlockModel.find(query);//.distinct('userId');
