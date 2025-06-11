"use strict";

const { verify } = require("jsonwebtoken");
// const { findUser } = require('../models/user');
const { STATUS_CODE } = require("../utils/constants");
const { findUser } = require("../models/user");

module.exports = () => {
  return (req, res, next) => {
    const token = req.header("token");
    if (!token)
      return next({
        statusCode: STATUS_CODE.UNAUTHORIZED,
        message: "unauthorized request!",
      });

    verify(token, process.env.JWT_SECRET, async function (err, decoded) {
      if (err) return next(new Error("Invalid Token"));
      else {
        const userObj = await findUser({ email: decoded.email });
        if (!userObj) return next(new Error("User not found!"));
        if (userObj.role != "admin") {
          return next(new Error("Please Login As Admin"));
        }
        req.user = decoded;
        next();
      }
    });
  };
};
