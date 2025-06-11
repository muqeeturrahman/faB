const { ROLES, MODULES } = require("../utils/constants");
const Joi = require("joi");

const timeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;  // Matches HH:mm format

exports.registerUserValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required.",
    "string.empty": "Email cannot be empty.",
    "string.email": "Email must be a valid email address.",
  }),
  password: Joi.string().min(5).max(30).required().messages({
    "any.required": "Password is required.",
    "string.empty": "Password cannot be empty.",
    "string.min": "Password must be at least {#limit} characters long.",
    "string.max":
      "Password must be less than or equal to {#limit} characters long.",
  }),
  role: Joi.string()
    .valid(ROLES.USER, ROLES.ORGANIZATION, ROLES.ADMIN)
    .default(ROLES.USER)
    .required(),
  deviceToken: Joi.string().optional(),
  deviceType: Joi.string().optional(),
}).messages({
  "object.unknown": "Invalid field {#label}",
});

exports.createUserProfileValidator = Joi.object({
  firstName: Joi.string().required().messages({
    "string.empty": "Full name cannot be empty.",
    "any.required": "First name is required.",
  }),
  lastName: Joi.string().required().messages({
    "string.empty": "Last Name cannot be empty.",
    "any.required": "Last Name is required.",
  }),
  age: Joi.number().required().messages({
    "any.required": "Age is required.",
    "number.base": "Age must be a number.",
  }),
  gender: Joi.string().allow(null).allow(""),
  longitude: Joi.string().required().messages({
    "any.required": "Longitude is required.",
  }),
  latitude: Joi.string().required().allow("", null).messages({
    "any.required": "Latitude is required.",
  }),
  profileImage: Joi.string().allow("", null),
  address:Joi.string().allow("",null)
}).messages({
  "object.unknown": "Invalid field {#label}",
});

exports.createOrganizationProfileValidator = Joi.object({
  bussinessName: Joi.string().required().messages({
    "string.empty": "Bussiness name cannot be empty.",
    "any.required": "Bussiness name is required."
  }),
  bussinessCategory: Joi.string().required().messages({
    "string.empty": "Bussiness category cannot be empty.",
    "any.required": "Bussiness category is required.",
  }),
  firstName: Joi.string().allow(null).allow(""),
  lastName:  Joi.string().allow(null).allow(""),
  bussinessDescription: Joi.string().required().messages({
    "string.empty": "Bussiness description cannot be empty.",
    "any.required": "Bussiness description is required.",
  }),

  longitude: Joi.number().allow(null, ""),
  latitude: Joi.number().allow(null, ""),
  profileImage: Joi.string().allow(null, ""),
  openTime: Joi.string().required().messages({
    "string.empty": "Open time cannot be empty.",
    "any.required": "Open time is required."  }),
  closeTime: Joi.string().required().messages({
    "string.empty": "Close time cannot be empty.",
    "any.required": "Close time is required.",
  }),
  address:Joi.string().allow("",null)
}).messages({
  "object.unknown": "Invalid field {#label}",
});

exports.loginUserValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required.",
    "string.empty": "Email cannot be empty.",
    "string.email": "Email must be a valid email address.",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required.",
    "string.empty": "Password cannot be empty.",
  }),
  deviceToken: Joi.string().required().messages({
    "any.required": "Device token is required.",
  }),
});

exports.forgotPasswordValidator = Joi.object({
  password: Joi.string().min(5).max(30).required().messages({
    "any.required": "Password is required.",
    "string.empty": "Password cannot be empty.",
    "string.min": "Password must be at least {#limit} characters long.",
    "string.max":
      "Password must be less than or equal to {#limit} characters long.",
  }),
});

exports.IsNotificationValidator = Joi.object({
  isNotification: Joi.boolean().required()
})

exports.addReportValidator = Joi.object({
  reportedId: Joi.string().required().messages({
    "any.message": "reportedId cannot is required",
    "string.empty": "reportedId cannot be empty"
}),
  text: Joi.string().required(),
  reason: Joi.string().required().messages({
    "any.message": "reason cannot is required",
    "string.empty": "reason cannot be empty"
}),
  type: Joi.string().valid(MODULES.EVENT, MODULES.SERVICE, MODULES.USER, MODULES.VENDOR).required().messages({
    "object.unknown": "Invalid field {#label}",
  })
})

exports.VibesValidator = Joi.object({
  vibesName: Joi.string().required().messages({
    "any.required": "Vibes Name is required.",
    "string.empty": "Vibes Name cannot be empty.",
  }),
  isActive : Joi.string().allow("", null),
})

exports.CategoryValidator = Joi.object({
  categoryName: Joi.string().required().messages({
    "any.required": "Category Name is required.",
    "string.empty": "Category Name cannot be empty.",
  }),
  isActive : Joi.string().allow("", null),
})

exports.PrefenceValidator = Joi.object({
  prefenceName: Joi.string().required().messages({
    "any.required": "Prefence Name is required.",
    "string.empty": "Prefence Name cannot be empty.",
  }),
  isActive : Joi.string().allow("", null),
})

exports.getuserprofileValidator=Joi.object({
  role: Joi.string()
  .valid(ROLES.USER, ROLES.ORGANIZATION)
  .default(ROLES.USER)

}).messages({
  "object.unknown": "Invalid field {#label}",
});

exports.toggleEnableDisableValidator=Joi.object({
  userId:Joi.string().required(),
  isActive:Joi.boolean().required()
}).messages({
  "object.unknown": "Invalid field {#label}",
});


exports.updateEventStatusValidator=Joi.object({
  eventId:Joi.string().required(),
  status:Joi.boolean().required()
}).messages({
  "object.unknown": "Invalid field {#label}",
})


exports.createReviewValidator=Joi.object({
  review:Joi.string().required().messages({
    "any.required": "review is required.",
    "string.empty": "review cannot be empty.",
  }),
  rating:Joi.number(),
  ambiance:Joi.number(),
  sourceId:Joi.string().required()
})

exports.deleteRequestValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required.",
    "string.empty": "Email cannot be empty.",
    "string.email": "Email must be a valid email address.",
  }),
  userPassword: Joi.string().required().messages({
    "any.required": "Password is required.",
    "string.empty": "Password cannot be empty.",
  }),
  reason: Joi.string().required().messages({
    "any.required": "Device token is required.",
  }),
});

exports.getusersbynameValdator = Joi.object({
  username: Joi.string().required().messages({
    "any.required": "user Name is required.",
    "string.empty": "user Name cannot be empty.",
  }),
});

