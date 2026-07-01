const Fine = require("../models/fine.model");

// @route  GET /api/fines/my
const getMyFines = async (req, res) =>{
    try{
        const fines = await Fine.find({ user: req.user._id})
        .populate("book", "title author isbn")
        .sort({createdAt: -1});

        res.json(fines);
    } catch(err){
        res.status(500).json({message: err.message});
    }
};


// @route  PUT /api/fines/:id/pay

const payFine = async (req, res) => {
    try{
        const fine= await Fine.findById(req.params.id);
        if(!fine) return res.status(404).json({message: "Fine not found"});

        if(fine.user.toString() !== req.user._id.toString()){
            return res.status(403).json({message:"Not your fine"});
        }
        if(fine.status=== "paid"){
            return res.status(400).json({message: "Fine already paid"});
        }

        fine.status = "paid";
        fine.paidAt= new Date();
        await fine.save();

        res.json(fine);
    }catch(err){
        res.status(500).json({message: err.message});
    }
};

// @route  GET /api/fines


const getAllFines= async(req,res)=>{
    try{
        const fines= await Fine.find()
        .populate("user","name email")
        .populate("book","title author")
        .sort({createdAt: -1});

        res.json(fines);
    }catch(err){
        res.status(500).json({message: err.message});
    }
};

module.exports = {getMyFines, payFine, getAllFines};