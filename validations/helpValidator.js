const Joi = require('joi')
exports.supportTicketSchema = Joi.object({
    title: Joi.string()
      .required()
      .min(3)
      .max(100)
      .trim()
      .messages({
        'string.empty': 'Title is required',
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title cannot exceed 100 characters',
        'any.required': 'Title is required'
      }),
    description: Joi.string()
      .required()
      .min(10)
      .max(1000)
      .trim()
      .messages({
        'string.empty': 'Description is required',
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 1000 characters',
        'any.required': 'Description is required'
      }),
    image: Joi.object({
      filename: Joi.string()
        .required(),
      size: Joi.number()
        .max(5 * 1024 * 1024)
        .required()
        .messages({
          'number.max': 'Image size cannot exceed 5MB'
        }),
      mimetype: Joi.string()
        .valid('image/jpeg', 'image/png', 'image/gif')
        .required()
        .messages({
          'any.only': 'Only JPEG, PNG and GIF images are allowed'
        }),
    }).allow(null) 
  });