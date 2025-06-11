'use strict';

const { NOTIFICATION_TYPE, NOTIFICATION_RELATED_TYPE } = require("../utils/constants");
const { Schema, model, Types } = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const {  sendNotificationToAll, getMongooseAggregatePaginatedData } = require("../utils");
const { getFcmTokens } = require("./user");
const { notificationCount } = require('../socket/socket');

const receiversSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    isRead: { type: Boolean, default: false }
}, { _id: false })

const notificationSchema = new Schema({
    receivers: [receiversSchema],
    sender: { type: Schema.Types.ObjectId, ref: 'user' },
    title: { type: String, default: null },
    body:{ type: String, default: null },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPE), required: true },
    sourceId: { type: Schema.Types.ObjectId, ref: 'service',default:null },
    image: { type: String, },
    relatedType: { type: String, enum: Object.values(NOTIFICATION_RELATED_TYPE), required: true },

}, { timestamps: true });
exports.getNotificationsbysourceid=(id)=>NotificationModel.find({sourceId:id})
// add pagination plugin
notificationSchema.plugin(mongoosePaginate);
notificationSchema.plugin(aggregatePaginate);

const NotificationModel = model("notification", notificationSchema);

// create new notification
exports.createNotification = (obj) => NotificationModel.create(obj);

// Assuming you have the required imports and schema defined

// Function to delete notifications based on a query
exports.seenNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;

        // Use Mongoose's findByIdAndUpdate to update the "seen" status of the notification
        const updatedNotification = await NotificationModel.findByIdAndUpdate(
            notificationId,
            { seen: true }, // Update the "seen" field to true
            { new: true } // Return the updated notification document
        );

        if (!updatedNotification) {
            // If the notification with the specified ID was not found, return a 404 response
            return res.status(404).json({ message: 'Notification not found.' });
        }

        // Respond with the updated notification
        res.status(200).json(updatedNotification);
    } catch (error) {
        // Handle any errors and respond with an error message
        res.status(500).json({ error: error.message });
    }
}
exports.deleteNotification = async (req, res) => {

    try {
        const notificationId = req.params.notificationId;
        const userIdToDelete = req.user.id;

        // Use Mongoose to update the notification by removing the matching receiver
        const updatedNotification = await NotificationModel.findByIdAndUpdate(
            notificationId,
            { $pull: { receivers: { user: userIdToDelete } } },
            { new: true }
        );

        if (!updatedNotification) {
            // If the notification with the specified ID was not found, return a 404 response
            return res.status(404).json({ message: 'Notification not found.' });
        }

        // Respond with the updated notification
        res.status(200).json(updatedNotification);
    } catch (error) {
        // Handle any errors and respond with an error message
        res.status(500).json({ error: error.message });
    }
};

//find notifications by receiverId and update isRead to true
const userUnReadNotificationsCount = async ({ userId }) => {
    const pipeline = [
        {
            $match: {
                'receivers.user': new Types.ObjectId(userId),
                'receivers.isRead': false
            }
        },
        { $count: 'count' }
    ];

    const result = await NotificationModel.aggregate(pipeline);
    const count = result?.length > 0 ? result[0]?.count : 0;
    await notificationCount({ userId, count })
    return true;
}
exports.user_notification_count = async ({ userId }) => {
    
    const pipeline = [
        {
            $match: {
                receivers: {
                    $elemMatch: {
                        user: new Types.ObjectId(userId),
                        isRead: false
                    }
                }
            }
        },
        { $count: 'count' }
    ];
    const result = await NotificationModel.aggregate(pipeline);
    const count = result?.length > 0 ? result[0].count : 0;
    await notificationCount({ userId, count })
    return true;
}
exports.findNotifications = async ({ query, page, limit, populate }) => {

    const { data, pagination } = await getMongooseAggregatePaginatedData({
        model: NotificationModel,
        query,
        page,
        limit,
    });

    // Separate query to populate the sender field
    await NotificationModel.populate(data, populate);

    return { result: data, pagination };
}

//const notification = await Notification.find({ 'receivers.user': userId });
exports.getNotifications = (query) => NotificationModel.find(query).sort({createdAt:-1})
exports.findNotificationById = (id) => NotificationModel.findById(id).populate({
    path: "sender sourceId",
    populate: [
        { path: "awardImages albumImages albums profileBackdropImages" },
        { 
            path: "polls",
            populate: [
                { 
                    path: "userId",
                    populate: { 
                        path: "awardImages albumImages albums profileBackdropImages" 
                    }
                },
                { path: "location" }
            ]
        }
    ]
});
exports.findNotificationById1 = (id) => NotificationModel.findById(id).populate({
    path: "sourceId",
    populate: [
        {
            path: "userId",
            populate: [
                {
                    path: "awardImages albumImages albums profileBackdropImages",
                },
                {
                    path: "albums",
                    populate: {
                        path: "albumImages",
                    },
                },
            ],
        },
        { 
            path: "location",
            populate: {
                path: "locationImages",
            },
        },
    ],
});


exports.findNotificationById2 = (id) => NotificationModel.findById(id).populate({
    path: "sender",
    populate: {
        path: "awardImages albumImages albums profileBackdropImages"
    }
    })





exports.updateNotifications = (query, obj) => NotificationModel.updateMany(query, obj, { new: true });

// create and send notification
exports.createAndSendNotification = async ({ senderObject, receiverIds, type, competition, sourceId, relatedId, relatedType }) => {
    console.log('type from crateAndSendNotification', receiverIds);
    let title, body;

    console.log('hello this is inam', senderObject)
    // console.log(competition)
    // return competition;
    console.log(receiverIds)
    const fcmTokens = await getFcmTokens(receiverIds);
    console.log('fcmTokens from createAndSendNotification >> ', fcmTokens);
    // console.log(competition)

    switch (type) {
        case NOTIFICATION_TYPE.VOTE_UP:
            title = 'up voted post';
            body = `${senderObject?.fullName} is upvoted your post in competition ${competition?.title}`;
            break;

        case NOTIFICATION_TYPE.ARTIST_CREATED:
            title = 'artist created';
            body = `${senderObject?.fullName} artist is created ${competition?.title}`;
            break;

        case NOTIFICATION_TYPE.VOTE_REMOVED:
            title = 'unvoted post';
            body = `${senderObject?.fullName} is unvoted your post in competition ${competition?.title}`;
            break;

        case NOTIFICATION_TYPE.VOTE_DOWN:
            title = 'down voted post';
            body = `${senderObject?.fullName} is down voted your post in competition ${competition?.title}`;
            break;

        case NOTIFICATION_TYPE.COMPETITION_JOINED:
            title = 'Competition joined';
            body = `${senderObject?.fullName} has joined in competition ${competition?.title}`;
            break;

        case NOTIFICATION_TYPE.COMPETITION_WINNER:
            console.log('this is the suggestion', senderObject?.fullName)
            title = 'Competition winner';
            body = `${senderObject?.fullName} has won the competition`;
            break;

        // To implement later in cron job
        case NOTIFICATION_TYPE.COMPETITION_STARTED:
            title = 'Competition started';
            body = `Competition ${competition?.title} has started now.`;
            break;

        // To implement later in cron job
        case NOTIFICATION_TYPE.COMPETITION_COMPLETED:
            title = 'Competition completed';
            body = `Competition ${competition?.title} has completed, now.`;
            break;

        case NOTIFICATION_TYPE.NEW_FOLLOWER:
            title = 'New follower';
            body = `${senderObject?.fullName} is now your follower!`;
            break;

        case NOTIFICATION_TYPE.UN_FOLLOW:
            title = 'Un-followed';
            body = `${senderObject?.fullName} has un-followed you.`;
            break;

        case NOTIFICATION_TYPE.COMMENT_ADDED:
            title = 'New comment';
            body = `${senderObject?.fullName} has commented on your post in competition ${competition?.title}.`;
            break;

        case NOTIFICATION_TYPE.RECOMMENT_ADDED:
            title = 'Re comment';
            body = `${senderObject?.fullName} has commented on the post in competition ${competition?.title}.`;
            break;

        case NOTIFICATION_TYPE.MESSAGE_SENT:
            title = 'New message';
            body = `You have received message from ${senderObject?.fullName}.`;
            break;

        case NOTIFICATION_TYPE.POST_ADDED:
            title = 'New Post';
            body = `New post is added in competition ${competition?.title}.`;
            break;
        case NOTIFICATION_TYPE.EVENT_APPROVED:
                title = 'Event Approved';
                body = `Your event has been successfully approved! `;
                break;
        case NOTIFICATION_TYPE.SESSION_REQUEST:
            title = `You have a session request.`;
            body = `${senderObject.fullName} has invited you to join the ${competition.sessionName} session. Here is your session code: ${competition.sessionCode}.`;
        break;
         case NOTIFICATION_TYPE.SESSION_JOINED:
            title = `Session Joined`;
            body = `${senderObject.fullName} have successfully joined the session.`;
            break;

        default:
            break;
    }

    const receivers = receiverIds.map((id) => {
        return { user: id, isRead: false }
    });


    const notification = await NotificationModel.create({
        receivers,
        sender: senderObject?.id,
        type,
        title,body,
        sourceId: competition?._id,
        sourceId,
        relatedId,
        relatedType,
        // image: Image
    });

    // sendNotificationToAll({ title, body, fcmTokens, notification });


    // for (const userId of receiverIds) {
    //     const some = await userUnReadNotificationsCount({ userId })
    //     console.log('inaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaam', some);
    // }
    for (const userId of receivers) {
        const pipeline = [
            {
                $match: {
                    receivers: {
                        $elemMatch: {
                            user: new Types.ObjectId(userId.user),
                            isRead: false
                        }
                    }
                }
            },
            { $count: 'count' }
        ];
    
        const result = await NotificationModel.aggregate(pipeline);
        const count = result?.length > 0 ? result[0]?.count : 0;
        await notificationCount({ count: count, userId: userId.user });
    }
    return notification;
}
exports.createAndSendNotification1 = async ({ senderObject, receiverIds, type,sourceId, relatedType, Image }) => {
    console.log("senderObject", senderObject);
    console.log('type from crateAndSendNotification', receiverIds);
    var title, body,_id;

    //below 2 condition are added because in the req.user there is a field of id and in whwn we are extracting id from query its_id
if(senderObject && senderObject.id){
    _id=senderObject.id
   console.log("_id is .id",_id);
}
if(senderObject && senderObject._id){
     _id=senderObject._id
   console.log("_id is _id",_id);

 }
    console.log('hello this is inam', senderObject?.fullName)
    console.log('hello this is id', _id)

    console.log(receiverIds)
    // const fcmTokens = await getFcmTokens(receiverIds);
    // console.log('fcmTokens from createAndSendNotification >> ', fcmTokens);


    switch (type) {
        case NOTIFICATION_TYPE.AD_APPROVED:
            title = 'ad casted';
            body = `Your add has been approved`;
            break;

        case NOTIFICATION_TYPE.BOOKING_SCHEDULED:
            title = 'booking Scheduled';
            body = `New booking has been scheduled`;
            break;

        case NOTIFICATION_TYPE.USER_CANCEL_BOOKING:
            title = 'booking cancelled';
            body = `Your booking has been cancelled`;
            break;

        case NOTIFICATION_TYPE.SESSION_REQUEST:
            title = 'session request';
            body = `You have a  session request`;
            break;

        case NOTIFICATION_TYPE.VENDOR_CANCEL_BOOKING:
            title = 'booking cancelled';
            body = `Vendor has cancelled your booking`;
            break;


        default:
            break;
    }

    const receivers = receiverIds.map((id) => {
        return { user: id, isRead: false }
    });

console.log("senderObject?._id,>>>>>>>>>>>>>>",senderObject.id);

    const notification = await NotificationModel.create({
        receivers,
        sender: _id,
        type,
        sourceId,
        title: title,
        body:body,
        relatedType,
        image: Image
    });

    // sendNotificationToAll({ title, body, fcmTokens, notification });


    for (const userId of receiverIds) {
        const some = await userUnReadNotificationsCount({ userId })
        console.log('inaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaam', some);
    }

    return notification;
}
exports.competitionWinnerNotification = async ({ senderObject, receiverIds, type, competition, sourceId, relatedId, relatedType, winner }) => {

    let title, body;
    title = 'Competition winner';
    body = `${winner?.fullName} has win the competition`;
    const fcmTokens = await getFcmTokens(receiverIds);
    const receivers = receiverIds.map((id) => {
        return { user: id, isRead: false }
    });
    const notification = await NotificationModel.create({
        receivers,
        sender: senderObject?._id,
        type,
        title: body,
        sourceId: competition?._id,
        sourceId,
        relatedId,
        relatedType
    });
    sendNotificationToAll({ title, body, fcmTokens, notification });
    for (const userId of receiverIds) {
        await userUnReadNotificationsCount({ userId })
    }

    return notification;
}


// create and send notification
exports.sendMessage = async ({ senderObject, receiverIds, type, sourceId, relatedId, relatedType }) => {
    let title, body;
    const fcmTokens = await getFcmTokens(receiverIds);
    console.log('fcmTokens from createAndSendNotification >> ', fcmTokens);
    title = 'new message';
    body = `${senderObject?.fullName} sends a message..`;
    const receivers = receiverIds.map((id) => {
        return { user: id, isRead: false }
    });


    const notification = await NotificationModel.create({
        receivers,
        sender: senderObject?._id,
        type,
        sourceId,
        title: body,
        sourceId,
        relatedId,
        relatedType
    });
    console.log('data', fcmTokens)

    sendNotificationToAll({ title, body, fcmTokens, notification });
    for (const userId of receiverIds) {
        await userUnReadNotificationsCount({ userId })
    }

    return notification;
}
