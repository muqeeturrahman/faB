const { STATUS_CODE, MODULES } = require("../utils/constants");
const { generateResponse, parseBody } = require("../utils/index");
const { addReportValidator } = require("../validations/userValidator");
const {
  addReport,
  getReport,
  deleteReport,
  getReportByUserId,
  getAllReports,
  updateReportById,
} = require("../models/report");

const { getEventById } = require("../models/events");

const { findService } = require("../models/services");

exports.createReport = async (req, res, next) => {
  try {
    let { reportedId, reason, text, type } = parseBody(req.body);
    let { error } = addReportValidator.validate(req.body);
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
    let reported;
    switch (type) {
      case MODULES.EVENT:
        reported = await getEventById(reportedId);
        break;
      case MODULES.SERVICE:
        reported = await findService({ _id: reportedId });
        break;
      default:
        reported = null;
    }

    if (!reported) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "the content you are reporting doesn't exists",
      });
    }
    let alreadyreported = await getReport({
      reportedBy: req.user.id,
      reportedTo: reportedId,
    });

    if (alreadyreported) {
      return next({
        status: false,
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: `you already reported the ${type}`,
      });
    }
    let report = await addReport({
      reportedBy: req.user.id,
      reportedTo: reportedId,
      reason,
      text,
      type,
    });

    generateResponse(report, `${type} is reported succesfully`, res);
  } catch (error) {
    next(new Error(error));
  }
};

exports.getAllUserReports = async (req, res, next) => {
  try {
    let data = await getReportByUserId(req.user.id);
    generateResponse(data, `reported retrieved succesfully`, res);
  } catch (error) {
    next(new Error(e));
  }
};

exports.getAllReportsForAdmin = async (req, res, next) => {
  try {
  } catch (error) {
    next(new Error(e));
  }
};

exports.deleteReport = async (req, res, next) => {
  try {
  } catch (error) {
    next(new Error(e));
  }
};
