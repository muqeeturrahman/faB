"use strict";

const { verify } = require("jsonwebtoken");
// const { findUser } = require('../models/user');
const { STATUS_CODE, ROLES } = require("../utils/constants");
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
        var userObj = await findUser({ _id: decoded.id });
        if (!userObj) return next(new Error("User not found!"));
        if(userObj.role === ROLES.USER){
          userObj = await findUser({ _id: decoded.id }).populate('profileId');
        }
        console.log(decoded)
        req.user = decoded;
        req.user.fullName = userObj?.profileId?.firstName
        console.log(req.user)
        
        next();
      }
    });
  };
};
