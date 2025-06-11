exports.STATUS_CODE = Object.freeze({
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    CONTENT_NOT_AVAILABLE: 410,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
});

exports.MODULES = Object.freeze({
    SERVICE: 'service',
    EVENT: 'event',
    USER: 'user',
    VENDOR: 'vendor',
})

exports.USER_STATUS =  Object.freeze({
    ALLEVENTS:"allEvents",
    MYEVENTS:"myEvents",
    COMPLETED:"completed",
    OTHERSEVENTS: "othersEvents"
})
exports.ROLES = Object.freeze({
    ADMIN: 'admin',
    USER: 'user',
    ORGANIZATION: 'organization'
})
exports.MESSAGE_TYPE = Object.freeze({
    MESSAGE: 'message',
    POLL: 'poll',
  
})
exports.SERVICE_STATUS = Object.freeze({
    OPENED: 'opened',
    CLOSED: 'closed'
})
exports.EVENT_STATUS = Object.freeze({
    COMPLETED: 'completed',
    STARTED: 'started',
    PENDING: "pending"
})

exports.GROUPESIZE = Object.freeze({
    SINGLE: 'single',
    COUPLE: 'couple',
    GROUP: 'group'
})

exports.MOODTTIME = Object.freeze({
    MORNING: 'morning',
    AFTERNOON: 'afternoon',
    NIGHT: 'night'
})


exports.MOODLOCATION = Object.freeze({
    INDOOR: 'indoor',
    OUTDOOR: 'outdoor',
    
})

exports.MOODVIBES= Object.freeze({
    FOODIE:"foodie",
    INTELLECTUAL:"intellectual",
    ROMANTIC:"romantic",
    RUGGEDOUTDOOR:"rugged outdoors",
    THEATRE:"theatre",
    HEREFORTHESHOW:"here for the show",
    GAMING:"gaming",
    SHOPPING:"shopping",
    ENTERTAINMENT:"entertainment"

})
exports.CATEGORY= Object.freeze({
    RESTAURANT:"restaurant",
    SPORTS:"sports",
    MOVIES:"movies entertainment",
    RECREATION:"recreation",
    LIVEPERFORMANCE:"live performances",
    SHOPPING:"shopping",

})
exports.MOODPREFERNCES= Object.freeze({
    
    SOCIALBUTTERFLIES:"social butterflies",
    FOODIE:"foodie",
    ROMANTIC:"romantic",
    ADVENTURERS:"adventurers",
    CULTURALEXPLORERS:"cultural explorers",
    NATURELOVERS:"nature lovers",
    HOMEBODIES:"home bodies",
    FITNESSENTHUSIASTS:"fitness enthusiasts",
    CREATIVES:"creatives",
    INTELLECTUALS:"intellectuals",

})

exports.NOTIFICATION_TYPE = Object.freeze({
    USER_CANCEL_BOOKING: 'cancelledBooking',
    EVENT_APPROVED: 'eventApproved',
    SESSION_REQUEST: 'sessionRequest',
    BOOKING_SCHEDULED:"bookingScheduled",
    AD_APPROVED:"ad Approved",
    VENDOR_CANCEL_BOOKING:"cancel booking",
    MESSAGE_SENT: 'message-sent',
    SESSION_JOINED: 'sessionJoined'

});


exports.NOTIFICATION_RELATED_TYPE = Object.freeze({
    MESSAGE: 'message',
    POST: 'post',
    EVENT: 'event',
    SERVICE:"service",
    BOOKING:"booking",
    UN_FOLLOW: 'un-follow',
    SESSION:"session"
});
