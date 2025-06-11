const { createHelpTicket } = require("../models/ticketModel");
const { generateResponse } = require("../utils");
const { STATUS_CODE } = require("../utils/constants");
const { supportTicketSchema } = require("../validations/helpValidator");
exports.createHelpTicket = async (req, res, next) => {
  try {
    const { user } = req.user.id;
    const data = supportTicketSchema.validate(req.body);
    if (data.error) {
      next(new Error(data.error.message));
    }
    let imageArray = [];
    if (req.files && req.files.image) {
      for (const image of req.files.image) {
        let newMedia;
        newMedia = await createMedia({
          file: image.filename,
          fileType: "Image",
          userId: user,
        });

        if (newMedia) {
          imageArray.push(newMedia._id);
        }
      }
    }
    let obj = {
      title: data.title,
      description: data.description,
      authId: user,
      image: imageArray,
    };

    const ticket = await createHelpTicket(obj);
    generateResponse(ticket, "Ticket created successfully", res);
  } catch (error) {
    console.error("Error handling createHelpTicket event:", error.message);
    next(new Error(error.message));
  }
};
