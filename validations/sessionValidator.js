const Joi = require('joi');
const JoiObjectId = require('joi-objectid')(Joi);
const { ObjectId } = require('mongoose').Types;
const { 
  GROUPESIZE, 
  MOODTTIME, 
  MOODLOCATION, 
  MOODVIBES, 
  MOODPREFERNCES 
} = require('../utils/constants');

const objectId = Joi.string().custom((value, helpers) => {
  if (!ObjectId.isValid(value)) {
    return helpers.message('Invalid MongoDB ObjectId');
  }
  return value;
}, 'MongoDB ObjectId');

exports.createSessionValidator = Joi.object({
  sessionName: Joi.string().min(1).required(),
  sessionVibes: Joi.array().items(objectId).required(),
  moodLocation: Joi.string().valid(
    ...Object.values(MOODLOCATION)
  ).required(),
  sessionPreference: Joi.array().items(objectId).required(),
  groupSize: Joi.string().valid(
    ...Object.values(GROUPESIZE)
  ).required(),
  sessionDistance: Joi.number().positive().required(),
  sessionTime: Joi.string().valid(
    ...Object.values(MOODTTIME)
  ).required(),
  invitedusers: Joi.array().items(JoiObjectId()).required()
});



exports.joinSessionValidator = Joi.object({
  sessionVibes: Joi.array().items(objectId).required(),
  moodLocation: Joi.string().valid(
    ...Object.values(MOODLOCATION)
  ).required(),
  sessionPreference: Joi.array().items(objectId).required(),
  groupSize: Joi.string().valid(
    ...Object.values(GROUPESIZE)
  ).required(),
  sessionDistance: Joi.number().positive().required(),
  sessionTime: Joi.string().valid(
    ...Object.values(MOODTTIME)
  ).required(),
  sessionCode:Joi.string().required(),
});
exports.useridValidator = Joi.object({
  userId: JoiObjectId().required().messages({
    'any.required': 'userId is required',
    'string.pattern.name': 'Invalid userId',
  }),
});

// Validator for validating sessionId
exports.sessionidValidator = Joi.object({
  sessionid: JoiObjectId().required().messages({
    'any.required': 'sessionid is required',
    'string.pattern.name': 'Invalid sessionid',
  })
});

exports.idValidator = Joi.object({
  id: JoiObjectId().required().messages({
    'any.required': 'id is required',
    'string.pattern.name': 'Invalid id',
  })
});