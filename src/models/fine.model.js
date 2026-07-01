const mongoose = require("mongoose");

const fineSchema = new mongoose.Schema(
    {
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
         borrow:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Borrow",
            required: true,
         },
         book: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Book",
            required: true,
         },
         daysLate:{
            type:Number,
            required: true,
            min: 1,
         },
         amount: {
            type: Number,
            required: true,
            min:0,
         },
         status: {
            type : String,
            enum: ["unpaid","paid","waived"],
            default: "unpaid",
         },
         paidAt:{
            type: Date,
            default: null,
         },
    },
    {timestamps: true}
);

module.exports= mongoose.model("Fine", fineSchema);