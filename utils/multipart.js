var multer = require("multer");
var path = require("path");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();
var __filename = module.filename;
var __dirname = path.dirname(__filename);

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS__KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET_NAME,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const fileName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, fileName);
  },
});
var localStorage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, path.join("uploads", "users"));
  },
  filename: function(req, file, callback) {
    var fileName = file.originalname.split(" ").join("-");
    var extension = path.extname(fileName);
    var baseName = path.basename(fileName, extension);
    callback(null, baseName + "-" + Date.now() + extension);
  },
});

var handleMultipartData = multer({
  storage: s3Storage,
  limits: {
    fileSize: 1024 * 1024 * 100,
  },
  fileFilter: function(req, file, callback) {
    var FileTypes = /jpeg|jpg|png|gif|mp4|mp3|mpeg/;
    var isValidFile = FileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (isValidFile) {
      callback(null, true);
    } else {
      callback(new Error("File type not supported"), false);
    }
  },
});

module.exports = {
  handleMultipartData,
};
