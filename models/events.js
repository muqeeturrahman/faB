"use strict";

const { populate } = require("dotenv");
let { Schema, model } = require("mongoose");
const path = require("path");
const {EVENT_STATUS} = require("../utils/constants");
const { query } = require("express");
const eventSchema = new Schema(
  {
    title: { type: String, default: null },
    date: { type: String, default: null},
    time: {type: String, default: null},
    location: { type: { type: String }, coordinates: [Number] },
    ticket_url: { type: String, default: null},
    description: { type: String, default : null},
    media: [{type: Schema.Types.ObjectId, ref: "Media", default: null}],
    view_count: { type: Schema.Types.Number, default: 0},
    user: { type: Schema.Types.ObjectId, ref:"user", default: null},
    status: {type: Schema.Types.Boolean, default:false },
    completion_status: {type: String, enum: [EVENT_STATUS], default: EVENT_STATUS.PENDING}
  },
  { timestamps: true }
);


const eventSchemaModel = model("event", eventSchema);

// create new OTP
exports.addEvent = (obj) => eventSchemaModel.create(obj);
// find OTP by query
exports.getSingleEvent = (query) => eventSchemaModel.findOne(query)

exports.getEventById =  (id) => eventSchemaModel.findById(id).populate({path:"media"}).populate({path:"user", populate:{
  path: "profileId", // Specify the fields you want to populate
  model: "orgprofiles", populate:{
    path: "profileImage portfolio"
  }
}});

exports.getAllUserEvents = (query) => eventSchemaModel.find(query)
// delete OTP
exports.deleteAllUserEvents = (email) => eventSchemaModel.deleteMany({ email });

exports.deleteSingleEvent = (id) => eventSchemaModel.deleteOne({_id: id})

exports.updateEvent = (id, query) => eventSchemaModel.findByIdAndUpdate(id, query,{new:true})
exports.updateEvents=(obj,query)=>eventSchemaModel.updateMany(obj,query)