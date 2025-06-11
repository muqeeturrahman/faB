"use strict";

let { Schema, model } = require("mongoose");

const reportSchema = new Schema(
  {
    reportedBy: { type: Schema.Types.ObjectId, default: null },
    reportedTo: { type: Schema.Types.ObjectId, default: null },
    reason: {type: String, default: null},
    text: {type: String, default: null},
    status: { type:  Schema.Types.Boolean, default: false}
  },
  { timestamps: true }
);


const ReportModel = model("report", reportSchema);

// create report
exports.addReport = (obj) => ReportModel.create(obj);

// find report
exports.getReport = (query) => ReportModel.findOne(query);
exports.getReports = (query) => ReportModel.find(query);


// delete report
exports.deleteReport = (email) => ReportModel.deleteOne({ email });

//get all reports by user
exports.getReportByUserId = (userId) => ReportModel.find({user: userId})

// get all reports by admin
exports.getAllReports = () => ReportModel.find({});

// this can be use for admin to accept the report
exports.updateReportById = (id, query) => ReportModel.updateReportById(id, query)