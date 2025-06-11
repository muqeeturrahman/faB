const Joi = require("joi");

exports.sendMessageValidation = Joi.object({
    receiver: Joi.array(),
    text: Joi.string().optional(),
    parent: Joi.string().optional(),
    channel:Joi.string()

});
