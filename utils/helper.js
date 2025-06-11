
const { getReports } = require("../models/report");
const { MODULES } = require("../utils/constants");
const crypto = require("crypto");
exports.convertTo24HourFormat=(time)=>{

    const [timePart, modifier] = time?.split(' ');
    let [hours, minutes] = timePart.split(':');
  
    if (hours === '12') {
      hours = '00';
    }
  
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
  
    return `${hours}:${minutes}:00`;
  }

  exports.populateOptions = (role) => {

    var populateOptions;
  if(role == "organization"){
    populateOptions = {
      path: "user",
      populate: {
        path: "profileId",

        model: "orgprofiles",

        model: "orgprofiles",

        populate: {
          path: "profileImage",
        },
      },
    };
  }
  else{
    populateOptions = {
      path: "user",
      populate: {
        path: "profileId",
        model: "userprofiles",
        populate: {
          path: "profileImage",
        },
      },
    };
  }

  return populateOptions;

  }
  exports.populateSender = (role) => {

    var populateOptions;
  if(role == "organization"){
    populateOptions = {
      path: "sender",
      populate: {
        path: "profileId",

        model: "orgprofiles",

        model: "orgprofiles",

        populate: {
          path: "profileImage",
        },
      },
    };
  }
  else{
    populateOptions = {
      path: "sender",
      populate: {
        path: "profileId",
        model: "userprofiles",
        populate: {
          path: "profileImage",
        },
      },
    };
  }

  return populateOptions;

  }
  //

  exports.getRandomElement = (arr) => {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
  }

   exports.getPreviousWeekDates = () => {
    const currentDate = new Date();
    const currentDay = currentDate.getDay();
    
    // Calculate the offset to the previous Monday
    const offsetToMonday = (currentDay === 0 ? 7 : currentDay) + 6;
    
    // Get the previous Monday
    const previousMonday = new Date(currentDate);
    previousMonday.setDate(currentDate.getDate() - offsetToMonday);
    
    // Create an array to hold the dates from Monday to Sunday
    const previousWeekDates = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(previousMonday);
        date.setDate(previousMonday.getDate() + i);
        previousWeekDates.push(date.toDateString());
    }
    
    return previousWeekDates;
}


exports.changeTimeFormat=()=>{
  let date = new Date();

  let hours = date.getHours();
  let minutes = date.getMinutes();

  // Check whether AM or PM
  let newformat = hours >= 12 ? 'PM' : 'AM';

  // Find current hour in AM-PM Format
  hours = hours % 12;

  // To display "0" as "12"
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;

  console.log(hours + ':' + minutes + ' ' + newformat);
  let time = hours + ':' + minutes + ' ' + newformat;
  return time;
}
exports.generateUniqueID=()=>{
  // Helper function to generate a UUID (version 4)
  function generateUUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  // Get the current timestamp
  const timestamp = new Date().getTime();

  // Generate a UUID
  const uuid = generateUUID();

  // Combine UUID with timestamp to create a unique ID
  return `${uuid}-${timestamp}`;
}

exports.getReportedEventByMeIds = async (userId) => {
  let Ids = await getReports({ reportedBy: userId, type: MODULES.EVENT })
  .select("reportedTo")
  .then(reports => reports.map(report => report.reportedTo));
  return Ids;
};

exports.processUsers = (joinedusers, awaitingusers) => {
  // Initialize the final result array
  let finalRes = [];

  // Process joined users if it's an array
  if (Array.isArray(joinedusers)) {
    console.log('Is Array User Joined');
    const joinedUsers = joinedusers.map(user => ({
      ...user,
      status: 'Joined',
    }));
    finalRes.push(...joinedUsers);
  }

  // Process awaiting users if it's an array
  if (Array.isArray(awaitingusers) && awaitingusers.length>0) {
    console.log('Is Array User Awaiting');
    const awaitingUsers = awaitingusers.map(user => ({
      ...user,
      status: 'Awaiting',
    }));
    finalRes.push(...awaitingUsers);
  }
  console.log('Final Response>>>', finalRes)
  // Return the merged result
  return finalRes;
};



exports.send_notification = (app, tokens, object, data) => {

  const message = {
    data,
    notification: object,
    tokens,
  };

  if (tokens.length > 0) {
    return app.messaging()
      .sendEachForMulticast(message)
      .then((response) => {
        console.log('Successfully sent message:', response);
        return response;
      })
      .catch((error) => {
        console.log('Error sending message:', error);
        throw error;
      });
  } else {
    throw new Error('No tokens provided');
  }
};

