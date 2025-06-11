"use strict";

const { deleteOTPs, addOTP } = require("../models/otp");
const {
  findUser,
  createUser,
  generateToken,
  updateUserById,
  updateUsers
} = require("../models/user");
const { generateResponse, parseBody, generateRandomOTP } = require("../utils");
const { STATUS_CODE } = require("../utils/constants");
const {
  registerUserValidation,
  createUserProfileValidator,
  loginUserValidation,
  forgotPasswordValidator,
  createOrganizationProfileValidator,
  deleteRequestValidation
} = require("../validations/userValidator");
const { compare, hash } = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/sendEmail");
const { createMedia, MediaModel } = require("../models/media");
const {
  createUserProfile,
  updateUserProfileById,
} = require("../models/userProfile");
const {
  createOrgProfile,
  findOrginazation,
  updateOrgProfileById,
  deleteportfiloOrgProfileById,
  updateportfilioOrgProfileById,
  deleteportfilioOrgProfileById,
} = require("../models/organizationProfile");
const { findUsermood } = require("../models/userMood");
const {createRequest,findRequest}=require("../models/deleteRequest")
const path = require("path");

exports.register = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { error } = registerUserValidation.validate(body);
    if (error) {
      const errorMessage =
        error.details && error.details[0]
          ? error.details[0].message
          : "Validation error";
      return next({
        status: false,
        statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
        message: errorMessage,
      });
    }

    try {
      const userExists = await findUser({ email: body.email,isDeleted:false });

      if (userExists)
        return next({
          data: {},
          statusCode: STATUS_CODE.BAD_REQUEST,
          message: "User already exists",
        });
      const hashedPassword = await hash(body.password, 10);
      body.password = hashedPassword;

      const user = await createUser(body);

      const token = generateToken(user);

      await deleteOTPs(body.email);

      const newOtp = generateRandomOTP();

      const otpObj = await addOTP({
        otp: newOtp,
        email: body.email,
      });
      await sendEmail(
        body.email,
        "Account Created Successfully ",
        `Your OTP is ${otpObj.otp}`
      );
      generateResponse(
        { user, otp: otpObj.otp, token },
        "OTP sent to registered email",
        res
      );
    } catch (e) {
      next(new Error(e));
    }
  } catch (err) {
    next(err);
  }
};

exports.verifytoken = async (req, res, next) => {
  try {
   
    const tokenHeader = req.headers["token"];
    if (!tokenHeader)
      return next({
        status: false,
        statusCode: STATUS_CODE.UNAUTHORIZED,
        message: "Token header not found",
      });

    jwt.verify(tokenHeader, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return next({
          status: false,
          statusCode: STATUS_CODE.UNAUTHORIZED,
          message: "Invalid token",
        });
      }
      const User = await findUser({ _id: decoded.id });
      if (!User) {
        return next({
          status: false,
          statusCode: STATUS_CODE.BAD_REQUEST,
          message: "user not found",
        });
      }
      
      if (User.role == "user") {
        let UserData = await findUser({ _id: decoded.id }).populate({
          path: "profileId", // Specify the fields you want to populate,
          model: "userprofiles",
          populate: {
            path: "profileImage",
          },
        });

        if (!User.isVerified) {
          const token = generateToken(User);
  
          await deleteOTPs(User.email);
  
          const newOtp = generateRandomOTP();
  
          const otpObj = await addOTP({
            otp: newOtp,
            email: User.email,
          });
          await sendEmail(
            User.email,
            "OTP",
            `Your OTP is ${otpObj.otp}`
          );
          return next({
            staus: false,
            statusCode: STATUS_CODE.BAD_REQUEST,
            message: "Please verify your account to login",
            data: {
              isVerified: false,
              token: token,
              otp: otpObj.otp,
              role: User.role,
              email: User.email
            },
          });
        }
        if (!User.isCompleted) {
          const token = generateToken(User);
  
          return next({
            statusCode: STATUS_CODE.BAD_REQUEST,
            staus: false,
            message: "Please complete your profile to login",
            data: { 
               isCompleted: false,
               token: token, 
               role: User.role,
               email: User.email
               },
          });
        }
        //for get
        const userMood = await findUsermood({ authId: decoded.id });

        UserData = {
          ...UserData.toObject(),
          userMood,
        };
        generateResponse({User:UserData}, "Wellcome", res);
      } else if (User.role == "organization") {

        let UserData = await findUser({ _id: decoded.id }).populate({
          path: "profileId", // Specify the fields you want to populate
          model: "orgprofiles",
          populate: [
            {
              path: "profileImage", // Nested population of profileImage within profileId
              model: "Media",
            },
            {
              path: "portfolio", // Nested population of portfolio within profileId
              model: "Media",
            },
          ],
        });

        if (!User.isVerified) {
          const token = generateToken(User);
  
          await deleteOTPs(User.email);
  
          const newOtp = generateRandomOTP();
  
          const otpObj = await addOTP({
            otp: newOtp,
            email: User.email,
          });
          await sendEmail(
            User.email,
            "OTP",
            `Your OTP is ${otpObj.otp}`
          );
          return next({
            staus: false,
            statusCode: STATUS_CODE.BAD_REQUEST,
            message: "Please verify your account to login",
            data: {
              isVerified: false,
              token: token,
              otp: otpObj.otp,
              role: User.role,
              email: User.email
            },
          });
        }
        if (!User.isCompleted) {
          const token = generateToken(User);
  
          return next({
            statusCode: STATUS_CODE.BAD_REQUEST,
            staus: false,
            message: "Please complete your profile to login",
            data: { isCompleted: false, token: token, role: User.role, email: User.email },
          });
        }
        generateResponse({User:UserData}, "Wellcome", res);
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createProfile = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const userId = req.user.id;

    const userAccount = await findUser({ _id: userId });
    const { role } = userAccount;

    if (role == "user") {
      const { error } = createUserProfileValidator.validate(body);

      if (error) {
        const errorMessage =
          error.details && error.details[0]
            ? error.details[0].message
            : "Validation error";
        return next({
          status: false,
          statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
          message: errorMessage,
        });
      }

      // if (Object.keys(req.files).length == 0) {
      //   return next({
      //     status: false,
      //     statusCode: STATUS_CODE.BAD_REQUEST,
      //     message: "Profile Image Required",
      //   });
      // }

      if (req.files) {
        if (req.files.profileImage && req.files.profileImage[0]) {
          const profilePicture = req.files.profileImage[0];
          let newMedia;
          newMedia = await createMedia({
            file: profilePicture.key,
            fileType: "Image", // Assuming award images are always images
            userId: userId,
          });

          if (newMedia) {
            body.profileImage = newMedia._id;
          }
        }
      }

      if (body.latitude && body.longitude) {
        body.location = {
          type: "Point",
          coordinates: [body.longitude, body.latitude],
        };
      }

      body.authId = userId;
      const profile = await createUserProfile(body);
      const user = await updateUserById(userId, {
        profileId: profile._id,
        isCompleted: true,
      }).populate({
        path: "profileId",
        populate: {
          path: "profileImage",
        },
      });

      const userDetails = await findUser({_id: userId}).populate({
        path: "profileId",
        model: "userprofiles",
        populate: {
          path: "profileImage",
        },
      });
      const token = generateToken(user);

      generateResponse(
        { User: userDetails, token },
        "Profile created successfully",
        res
      );
    } else {
      const { error } = createOrganizationProfileValidator.validate(body);

      if (error) {
        const errorMessage =
          error.details && error.details[0]
            ? error.details[0].message
            : "Validation error";
        return next({
          status: false,
          statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
          message: errorMessage,
        });
      }

      if (Object.keys(req.files).length == 0) {
        return next({
          status: false,
          statusCode: STATUS_CODE.BAD_REQUEST,
          message: "Profile Image Required",
        });
      }

      if (role == "organization" && !req.files.portfolioImage) {
        return next({
          status: false,
          statusCode: STATUS_CODE.BAD_REQUEST,
          message: "Portfolio Images Required",
        });
      }

      if (req.files) {
        if (req.files.profileImage && req.files.profileImage[0]) {
          const profilePicture = req.files.profileImage[0];
          let newMedia;
          newMedia = await createMedia({
            file: profilePicture.key,
            fileType: "Image", // Assuming award images are always images
            userId: userId,
          });

          if (newMedia) {
            body.profileImage = newMedia._id;
          }
        }
        if (req.files.portfolioImage && req.files.portfolioImage.length) {
          let portfolioImage = [];
          for (
            let index = 0;
            index < req.files.portfolioImage.length;
            index++
          ) {
            const element = req.files.portfolioImage[index];
            let newMedia = await createMedia({
              file: element.key,
              fileType: "Image", // Assuming award images are always images
              userId: userId,
            });
            portfolioImage.push(newMedia._id);
          }
          body.portfolio = portfolioImage;
        }
      }

      if (body.latitude && body.longitude) {
        body.location = {
          type: "Point",
          coordinates: [body.longitude, body.latitude],
        };
      }
      body.authId = userId;

      const profile = await createOrgProfile(body);

      const user = await updateUserById(userId, {
        profileId: profile._id,
        isCompleted: true,
      });

      const User = await findUser({ _id: userId }).populate({
        path: "profileId", // Specify the fields you want to populate
        model: "orgprofiles",
        populate: [
          {
            path: "profileImage", // Nested population of profileImage within profileId
            model: "Media",
          },
          {
            path: "portfolio", // Nested population of portfolio within profileId
            model: "Media",
          },
        ],
      });

      const userDetails = await findUser({_id: userId}).populate({
        path: "profileId",
        model: "orgprofiles",
        populate: {
          path: "profileImage portfolio",
        },
      });
      const token = generateToken(User);

      generateResponse(
        { User: userDetails, token: token },
        "Profile created successfully",
        res
      );
    }
  } catch (e) {
    return next({
      status: false,
      statusCode: STATUS_CODE.UNAUTHORIZED,
      message: e,
    });
  }
};

exports.login = async (req, res, next) => {
  const body = parseBody(req.body);

  const { error } = loginUserValidation.validate(body);
  if (error)
    return next({
      data: {
        status: false,
      },
      statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
      message: error.details[0].message,
    });
  const { email, password, device_token } = body;
  try {
    const user = await findUser({ email:email, isDeleted:false}).select("+password");
    // let update=await updateUsers({},{isDeleted:false})
    if (!user)
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "User not found or your account is deleted",
      });
      
    else {
      const isMatch = await compare(password, user.password);
      if (!isMatch)
        return next({
          status: false,
          statusCode: STATUS_CODE.BAD_REQUEST,
          message: "Invalid credentials",
        });

      if (!user.isVerified) {
        const token = generateToken(user);

        await deleteOTPs(email);

        const newOtp = generateRandomOTP();

        const otpObj = await addOTP({
          otp: newOtp,
          email: body.email,
        });
        await sendEmail(
          body.email,
          "Account Created Successfully ",
          `Your OTP is ${otpObj.otp}`
        );
        return next({
          staus: false,
          statusCode: STATUS_CODE.BAD_REQUEST,
          message: "Please verify your account to login",
          data: {
            isVerified: false,
            token: token,
            otp: otpObj.otp,
            role: user.role,
          },
        });
      }
      if (!user.isCompleted) {
        const token = generateToken(user);

        return next({
          statusCode: STATUS_CODE.BAD_REQUEST,
          staus: false,
          message: "Please complete your profile to login",
          data: { isCompleted: false, token: token, role: user.role },
        });
      }

      let updatedUser = await updateUserById(user._id, {
        $set: { device_tokens: device_token },
      });

      let UserData;
      let User;

      if (user.role == "user") {
        //for get profile
        UserData = await findUser({ _id: user._id }).populate({
          path: "profileId", // Specify the fields you want to populate
          model: "userprofiles",
          populate: {
            path: "profileImage",
          },
        });

        //for get
        const userMood = await findUsermood({ authId: user._id });

        User = {
          ...UserData.toObject(),
          userMood,
        };
      } else if (user.role == "organization") {
        User = await findUser({ _id: user._id }).populate({
          path: "profileId", // Specify the fields you want to populate
          model: "orgprofiles",
          populate: [
            {
              path: "profileImage", 
              model: "Media",
            },
            {
              path: "portfolio", 
              model: "Media",
            },
          ],
        });
      }

      const token = generateToken(user);
      generateResponse({ User, token }, "Login successful", res);
    }
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const userId = req.user.id;
    const { error } = forgotPasswordValidator.validate(body);
    if (error) {
      const errorMessage =
        error.details && error.details[0]
          ? error.details[0].message
          : "Validation error";
      return next({
        status: false,
        statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
        message: errorMessage,
      });
    }

    const getUser = await findUser({ _id: userId });

    if (!getUser)
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "User not found",
      });

    const hashedPassword = await hash(body.password, 10);
    body.password = hashedPassword;

    const updateUser = await updateUserById(userId, {
      password: hashedPassword,
    });

    const token = generateToken(updateUser);

    generateResponse({ updateUser, token }, "Password Reset Successfully", res);
  } catch (e) {
    next(e);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const userId = req.user.id;

    const userAccount = await findUser({ _id: userId });
    const { role, profileId } = userAccount;

    if (role == "user") {
      if (req.files) {
        if (req.files.profileImage && req.files.profileImage[0]) {
          const profilePicture = req.files.profileImage[0];
          let newMedia;
          newMedia = await createMedia({
            file: profilePicture.key,
            fileType: "Image",
            userId: userId,
          });

          if (newMedia) {
            body.profileImage = newMedia._id;
          }
        }
      }

      if (body.latitude && body.longitude) {
        body.location = {
          type: "Point",
          coordinates: [body.longitude, body.latitude],
        };
      }

      const profile = await updateUserProfileById(profileId, body);
      let user = await findUser({ _id: userId }).populate({
        path: "profileId",
        model: "userprofiles",
        populate: {
          path: "profileImage",
        },
      });

      const userMood = await findUsermood({ authId: userId });

      user = {
        ...user.toObject(),
        userMood,
      };

      generateResponse({ User: user }, "Profile updated successfully", res);
    } else {
      // console.log(body.deleteportfolio)

      if (req.files) {
        if (req.files.profileImage && req.files.profileImage[0]) {
          const profilePicture = req.files.profileImage[0];
          let newMedia;
          newMedia = await createMedia({
            file: profilePicture.key,
            fileType: "Image",
            userId: userId,
          });

          if (newMedia) {
            body.profileImage = newMedia._id;
          }
        }

        if (body.deleteportfolio) {
          await deleteportfilioOrgProfileById(profileId, body.deleteportfolio);
        }

        if (req.files.portfolioImage && req.files.portfolioImage.length) {
          let portfolioImage = [];
          for (
            let index = 0;
            index < req.files.portfolioImage.length;
            index++
          ) {
            const element = req.files.portfolioImage[index];
            let newMedia = await createMedia({
              file: element.key,
              fileType: "Image",
              userId: userId,
            });
            portfolioImage.push(newMedia._id);
          }
          await updateportfilioOrgProfileById(profileId, portfolioImage);
        }
      }

      if (body.latitude && body.longitude) {
        body.location = {
          type: "Point",
          coordinates: [body.longitude, body.latitude],
        };
      }

      const profile = await updateOrgProfileById(profileId, body);
      const user = await findUser({ _id: userId }).populate({
        path: "profileId",
        model: "orgprofiles",
        populate: [
          {
            path: "profileImage",
            model: "Media",
          },
          {
            path: "portfolio",
            model: "Media",
          },
        ],
      });

      generateResponse(
        { User: user },
        "Profile updated successfully",
        res
      );
    }
  } catch (e) {
    return next({
      status: false,
      statusCode: STATUS_CODE.UNAUTHORIZED,
      message: e,
    });
  }
};

exports.deleteAccount=async(req,res,next)=>{
  try{
    const userId = req.user.id;

    const deleteAccount = await updateUserById(userId,{isDeleted:true});
    generateResponse({}, "account deleted successfully", res);
  }
  catch (e) {
    next(new Error(e.message))
  }
}
exports.deleteRequest = async (req, res,next) => {
  try {
    const { reason, email, userPassword } = req.body;
    const { error } = deleteRequestValidation.validate(req.body);
  if (error)
    return next({
      data: {
        status: false,
      },
      statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
      message: error.details[0].message,
    });

   // Extract the "reason"  from req.body
    const user = await findUser({ email:email}).select("+password");
    console.log(user);
    
    // let update=await updateUsers({},{isDeleted:false})
    if (!user)
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "User not found or your account is deleted",
      });
    else {
      const isMatch = await compare(userPassword, user.password);
      if (!isMatch)
        return next({
          status: false,
          statusCode: STATUS_CODE.BAD_REQUEST,
          message: "Invalid credentials",
        });
      }
    const alreadyRequest = await findRequest({ user: user._id });
    if (alreadyRequest) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "your request is already submitted",
      });
    }
    const deleteAccountRequest = await createRequest({
      user: user._id,
      reason: reason, // Pass the extracted reason as a string
    });
    generateResponse(deleteAccountRequest, "Delete account request sent successfully", res);
  } catch (e) {
    next(new Error(e.message))
  }
};

