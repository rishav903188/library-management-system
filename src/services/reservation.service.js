const Reservation = require("../models/reservation.model");
const Book = require("../models/book.model"); 


const createReservation = async (userId, bookId)=>{
    const book = await Book.findById(bookId);
    if(!book){
        const error = new Error ("Book not found");
        error.statusCode = 404;
        throw error;
    }

    if(book.availableCopies > 0){
        const error = new Error(
            "copies are available right now - borrow directly instead of reserving"
        );
        error.statusCode = 400;
        throw error;
    }

    const existing = await Reservation.findOne({
        user: userId,
        book: bookId,
        status: {$in: ["waiting", "notified"]}
    });

    if(existing){
        const error = new Error(" you already have an active reservation. for this book");
        error.statusCode = 400;
        throw error;
    }
    const reservation = await Reservation.create({user: userId, book: bookId});
    return reservation;

};

const getQueuePosition = async (bookId, reservationId)=>{
    const reservation = await Reservation.findById(reservationId);
    if(!reservation || reservation.status !== "waiting") return null;

    const position = await Reservation.countDocuments({
        book: bookId,
        status: "waiting",
        createdAt: {$lte: reservation.createdAt},
    });
    return position;
};

const fulfilNextReservation = async (bookId)=>{
    const next = await Reservation.findOne({
        book:bookId,
        status: "waiting",
    }).sort({createdAt: 1 });

    if(!next) return null;

    next.status= "notified";
    next.notifiedAt = new Date();
    await next.save();

    const book = await Book.findById(bookId);
    if(book && book.availableCopies > 0){
        book.availableCopies -=1;
        await book.save();
    }
    const user = await UserActivation.findById(next.user);
    if(user && book){
        await sendReservationReadyEmail(user, book);
    }
    return next;
};

module.exports = {createReservation, getQueuePosition, fulfilNextReservation};

