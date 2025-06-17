const { updateEvents } = require("../models/events")
const cron = require('node-cron');
const { changeTimeFormat, convertTo24HourFormat } = require("../utils/helper.js")
const { findServices, updateServices, updateService, } = require("../models/services.js")
const { findBookings, updateBooking } = require("../models/bookingModel")
// const convertTo24HourFormat = (time) => {
//   if (!time) {
//     console.error('Invalid time format:', time);
//     return null;
//   }

//   const [timePart, modifier] = time.split(' ');
//   let [hours, minutes] = timePart.split(':');

//   if (hours === '12') {
//     hours = '00';
//   }

//   if (modifier === 'PM' && hours !== '00') {
//     hours = parseInt(hours, 10) + 12;
//   }

//   return `${hours}:${minutes}:00`;
// };
// const serviceStartTime = new Date(`1970-01-01T${convertTo24HourFormat(service.startingDate)}`)

// cron.schedule('5 0 * * *', async () => {
//     let date = new Date().toISOString()
//     let d = date.split("T")[0]
//     console.log(d, "d>>>");
//     await updateEvents({ date: { $lt: d } }, { completion_status: "completed" })

// });




// cron.schedule(' * * * * * ', async () => {
//     const service = await findServices({});

//     let startTime = new Date().toISOString().split("T")[1]


//     let serviceStartTime;
//     let serviceEndTime;
//     service.map(async (e) => {
//         if (e.startingDate && e.endingDate) {
//             serviceStartTime = e?.startingDate.split(" ")[1];
//             serviceEndTime = e?.endingDate.split(" ")[1];
//         }
//         if (startTime >= serviceStartTime && startTime <= serviceEndTime) {

//             await updateService(e._id, { status: "opened" })
//         }else{
      

//             await updateService(e._id, { status: "closed" })
//         }
//     })
//     const bookings = await findBookings({})
//     let currentTime = new Date().toISOString()
//     bookings?.map(async (e) => {
//         let end1 = new Date(e.endTime).toISOString()
//         if (e.status != "cancelled") {
//             if (currentTime > end1) {
//                 await updateBooking(e._id, { status: "completed" })
//             }

//         }

//     })

// });


