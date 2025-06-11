const { Schema, model } = require("mongoose");

const clickCountSchema = new Schema(
  {


    service: { type: Schema.Types.ObjectId, ref: "service", default: null, },
    day: { type: String, default: null },
    user: { type: Schema.Types.ObjectId, ref: "user", default: null, },
    clickCount: { type: Number, default: 0 },
    date:{ type: String, default: null },
  },
  { timestamps: true }
);


const clickCountServiceModel = model("clickCount", clickCountSchema);

exports.createclickCount = (obj) => clickCountServiceModel.create(obj)

exports.findclickCount = (query) => clickCountServiceModel.findOne(query)
exports.findclickCounts = (serviceIds,weekDates) => clickCountServiceModel.find({service:{$in:serviceIds},date:{$in:weekDates}})
