const Fine = require("../models/fine.model");

const FINE_PER_DAY = 5;

const calculateDaysLate = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  due.setHours(0, 0, 0, 0);
  returned.setHours(0, 0, 0, 0);

  const diffMs = returned - due;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

const createFineIfLate = async (borrow) =>{
    const daysLate = calculateDaysLate(borrow.dueDate,borrow.returnDate);

    if(daysLate <= 0) return null;
    
    const amount = daysLate * FINE_PER_DAY;
    const fine = await Fine.create({
        user: borrow.user,
        borrow:borrow._id,
        book: borrow.book,
        daysLate:daysLate,
        amount:amount,
    });

    return fine;
};

module.exports = {calculateDaysLate, createFineIfLate, FINE_PER_DAY};