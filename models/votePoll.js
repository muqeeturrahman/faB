"use strict";

const { populate } = require("dotenv");
let { Schema, model } = require("mongoose");
const path = require("path");

const votePollSchema = new Schema(
    {

        poll: { type: Schema.Types.ObjectId, ref: "poll"},
        serviceId: { type: Schema.Types.ObjectId, ref: "service"},
        user: { type: Schema.Types.ObjectId, ref: "user" }
    },
    { timestamps: true }
);

const votePollModel = model("votePoll", votePollSchema);

// create new OTP
exports.votePoll = (obj) => votePollModel.create(obj);
// find OTP by query
exports.getVote = (query) => votePollModel.find(query)
exports.deleteVote = (id) => votePollModel.deleteMany(id)

// poll user/ servicesIds
// vote user / service_id/ pollId

// poll create 
// vote userId, pollId, serviceId
// check already userId, pollId, serviceId == userId, pollId, serviceId

// get aggreage match 