const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const ticketSchema = new Schema(
  {
    ticketNumber: {
        type: Number,
        required: true,
        unique: true,
        default: async function () {
            const lastHelp = await this.constructor.findOne().sort({ ticketNumber: -1 });
            return lastHelp ? lastHelp.ticketNumber + 1 : 1;
        }
    },
    authId: { type: Schema.Types.ObjectId, ref: "user", default: null },
    image: [{ type: Schema.Types.ObjectId, ref: "Media", default: null }],
    title : {type:String,required:true},
    description : {type:String,required:true},
    status : {type:String,default:'open'},
    __v: { type: Number, select: false }  
  },
  { timestamps: true }
);



ticketSchema.plugin(mongoosePaginate);
ticketSchema.plugin(aggregatePaginate);

const ticketModel = model("tickets", ticketSchema);

exports.createHelpTicket = (obj) => ticketModel.create(obj);
