
const { Schema, model,  } = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require("../utils/index");
const { query } = require("express");

const chatSchema = new Schema({
    users: [{ type: Schema.Types.ObjectId, ref: "user", required: true }],
    channel: { type: String, required: true },
    session: {type:  Schema.Types.ObjectId, ref: "session"}, 
    lastMessage: { type: Schema.Types.ObjectId, ref: "message" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "user" },
}, { timestamps: true });


chatSchema.plugin(mongoosePaginate);
chatSchema.plugin(aggregatePaginate);

const ChatModel = model("Chat", chatSchema);

// create new chat
exports.createChat = (obj) => ChatModel.create(obj);

// update last message in chat
exports.updateChat = (query, obj) => ChatModel.updateOne(query, obj, { new: true });


exports.updateChats = (query, obj) => ChatModel.updateMany(query, obj, { new: true });

// find chats by query
exports.findChats = async ({ query, page, limit, populate }) => {
    const { data, pagination } = await getMongooseAggregatePaginatedData({
        model: ChatModel,
        query,
        page,
        limit, 
        populate,
        sort: { updatedAt: -1 }
    });

    return { result: data, pagination };
}
exports.updateChat = (query, obj) => ChatModel.updateOne(query, obj, { new: true });

// find chat by query
exports.findChat = (query) => ChatModel.findOne(query).populate('users lastMessage');

// remove chat-box
exports.removeChat = (id) => ChatModel.findByIdAndDelete(id);


