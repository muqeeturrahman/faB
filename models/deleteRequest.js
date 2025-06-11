let { Schema, model } = require("mongoose");
const deleteRequestSchema =new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "user", default: null, },
        reason: {
            type: String,
            required: true,
        },
        requestStatus: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending"
        },
    },
    {
        timestamps: true,
    }
);

const deleteRequestModel = model("deleteRequest", deleteRequestSchema);
exports.createRequest = (obj) => deleteRequestModel.create(obj)

exports.findRequest = (query) => deleteRequestModel.findOne(query)
exports.findRequests = (query) => deleteRequestModel.find(query)
exports.updateRequest = (id, query) => deleteRequestModel.findByIdAndUpdate(id, query,{new:true})


