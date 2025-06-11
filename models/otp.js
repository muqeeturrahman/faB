"use strict";

let { Schema, model } = require("mongoose");

const otpSchema = new Schema(
  {
    email: { type: String, required: true },
    otp: { type: Number, required: true },
  },
  { timestamps: true }
);

// OTP will be expired in 1 minutes
otpSchema.methods.isExpired = function () {
  return Date.now() - this.createdAt > Number(process.env.OTP_EXPIRATION);
};

const OTPModel = model("OTP", otpSchema);

// create new OTP
exports.addOTP = (obj) => OTPModel.create(obj);

// find OTP by query
exports.getOTP = (query) => OTPModel.findOne(query);

// delete OTP
exports.deleteOTPs = (email) => OTPModel.deleteMany({ email });
