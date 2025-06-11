const { getOTP, deleteOTPs, addOTP } = require("../models/otp");
const { findUser, generateToken, updateUserById } = require("../models/user");
const { generateResponse, parseBody, generateRandomOTP } = require("../utils");
const { STATUS_CODE } = require("../utils/constants");
const { sendEmail } = require("../utils/sendEmail");

exports.generateOTP = async (req, res, next) => {
  const { email } = parseBody(req.body);
  if (!email)
    return next({
      data: { status: false },
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: "Email is required",
    });

  try {
    const user = await findUser({ email });
    if (!user)
      return next({
        data: { status: false },
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "User not found",
      });
    // delete all previous OTPs
    await deleteOTPs(email);

    const otpObj = await addOTP({
      email,
      otp: generateRandomOTP(),
    });

    // send email
    const token = generateToken(user);
    await sendEmail(email, "New Otp", `Your OTP is ${otpObj.otp}`);

    generateResponse({ otp: otpObj, token,role:user.role }, "OTP sent to registered email", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.verifyOtp = async (req, res, next) => {
  console.log("test")
  const { otp } = parseBody(req.body);
  try {
    if (!otp) {
      return next({
        status: false,
        statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
        message: "OTP is required",
      });
    }
    console.log("test")
    const otpObj = await getOTP({ otp });
    if (!otpObj) {
      return next({
        status: false,
        statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
        message: "Invalid OTP",
      });
    }

    if (otpObj.isExpired())
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "OTP expired",
      });
      console.log("test")

    const existingUser = await findUser({ email: otpObj.email });
    if (!existingUser)
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "User not found",
      });

    // update user isVerified to true
    const User = await updateUserById(existingUser._id, { isVerified : true });

    const token = generateToken(existingUser);
    await sendEmail(otpObj.email, "OTP verified successfully ", ``);
    generateResponse({ User, token }, "OTP verified successfully", res);
  } catch (e) {
    return next({
      status: false,
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: e,
    });
  }
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = parseBody(req.body);
  if (!email)
    return next({
      data: { status: false },
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: "Email is required",
    });

  try {
    const user = await findUser({ email });
    if (!user)
      return next({
        data: { status: false },
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "User not found",
      });

    // delete all previous OTPs
    await deleteOTPs(email);

    const otpObj = await addOTP({
      email,
      otp: generateRandomOTP(),
    });

    // send email
    const token = generateToken(user);
    await sendEmail(email, "Forget Password", `Your OTP is ${otpObj.otp}`);

    generateResponse({ otp: otpObj, token }, "OTP sent to registered email", res);
  } catch (error) {
    next(new Error(error.message));
  }
};



exports.verifyforgotOtp = async (req, res, next) => {
  const { otp } = parseBody(req.body);
  try {
    if (!otp) {
      return next({
        status: false,
        statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
        message: "OTP is required",
      });
    }
    const otpObj = await getOTP({ otp });
    if (!otpObj) {
      return next({
        status: false,
        statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
        message: "Invalid Otp",
      });
    }

    if (otpObj.isExpired())
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "OTP expired",
      });

    const existingUser = await findUser({ email: otpObj.email });
    if (!existingUser)
      return next({
        status: false,
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "User not found",
      });


    const token = generateToken(existingUser);
    await sendEmail(otpObj.email, "OTP verified successfully ", ``);
    generateResponse({ existingUser, token }, "OTP verified successfully", res);
  } catch (e) {
    return next({
      status: false,
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: e,
    });
  }
};
