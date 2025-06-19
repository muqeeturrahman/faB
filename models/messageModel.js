'use strict';
// role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
const { Schema, model, } = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData, getMongoosePaginatedData } = require("../utils");
const { MESSAGE_TYPE } = require("../utils/constants");
const { query } = require("express");

const messageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: "user", required: true },
  receiver: [{ type: Schema.Types.ObjectId, ref: "user", required: true }],
  parent: { type: Schema.Types.ObjectId, ref: "message", default: null },
  sessionId: { type: Schema.Types.ObjectId, ref: "sesion", default: null },
  ticketId : { type: Schema.Types.ObjectId, ref: "tickets", default: null },
  text: { type: String, required: false, default: null },
  channel: { type: String, required: true },
  media: [{ type: String }],
  isRead: { type: Boolean, default: false },
  deletedBy: [{ type: Schema.Types.ObjectId, ref: "user", default: null }],
  isDeletedForEveryone: { type: Boolean, default: false },
  type: { type: String, enum: Object.values(MESSAGE_TYPE), default: MESSAGE_TYPE.MESSAGE },
  poll: { type: Schema.Types.ObjectId, ref: "poll", default : null},
  flaggedBy: { type: Schema.Types.ObjectId, ref: "user"},
}, { timestamps: true });

messageSchema.plugin(mongoosePaginate);
messageSchema.plugin(aggregatePaginate);




const MessageModel = model("message", messageSchema);
exports.MessageModelL =
// create new message
exports.createMessage = (obj) => MessageModel.create(obj);

// find messages by query with pagination
exports.findMessages = async ({ query, page, limit, populate }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: MessageModel,
    query,
    page,
    limit,
    populate
  });

  return { result: data, pagination };
}

exports.findMessageByAggregate = async (query) => MessageModel.aggregate(query);

// get messages without pagination
exports.getMessages = (query) => MessageModel.find(query);

// find message by query
exports.findMessageById = (messageId) => MessageModel.findById(messageId);



exports.unSeenMessageCountQuery = (userId) => MessageModel.countDocuments({
  receiver: userId,
  isRead: false
});


exports.unSeenMessageCountByChannelQuery = (userId,channel) => MessageModel.countDocuments({
  receiver: userId,
  channel,
  isRead: false
});

exports.getMessageWithDetails = (query) => MessageModel.aggregate(query)

// update message by query
exports.updateMessages = (query, obj) => MessageModel.updateMany(query, obj, { new: true });

// delete message by user
exports.updateMessageById = (messageId, obj) => MessageModel.findByIdAndUpdate(messageId, obj, { new: true });

// delete Message
exports.deleteMessageById = (messageId) => MessageModel.findByIdAndDelete(messageId);


