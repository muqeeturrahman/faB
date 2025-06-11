const { generateResponse, parseBody } = require("../utils");
const { STATUS_CODE } = require('../utils/constants')
const { getNotifications,updateNotifications,user_notification_count } = require("../models/notificationModel")
const {findSessionbyid}=require("../models/sessionModel");
const { notificationCount } = require("../socket/socket");
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await getNotifications({ 'receivers.user': req.user.id });
        console.log("🚀 ~ exports.getNotifications= ~ notifications:", notifications)
        
        if (notifications.length === 0) {
            return next({
                statusCode: STATUS_CODE.BAD_REQUEST,
                status: false,
                message: "No notifications",
            });
        }
    //     getNotificationcomment(){ 
    //     // const groupedNotifications = notifications.reduce((acc, notification) => {
    //     //     const type = notification.relatedType;
    //     //     if (!acc[type]) {
    //     //         acc[type] = [];
    //     //     }
    //     //     acc[type].push(notification);
    //     //     return acc;
    //     // }, {});

        
    //     // const updatedNotifications = [];
    //     // for (const [type, notifGroup] of Object.entries(groupedNotifications)) {
    //     //     await Promise.all(notifGroup.map(async (notification) => {
    //     //         const sourceId = notification.sourceId;
    //     //         const relatedType = notification.relatedType;

    //     //         switch (relatedType) {
    //     //             case 'session':
    //     //                 try {
    //     //                     const session = await findSessionbyid(sourceId);
    //     //                     if (session) {
    //     //                         console.log(`Session found for sourceId ${sourceId}:`, session);
    //     //                         updatedNotifications.push({
    //     //                             notification,
    //     //                             session
    //     //                         });
    //     //                     } else {
    //     //                         console.log(`No session found for sourceId: ${sourceId}`);
    //     //                         updatedNotifications.push({
    //     //                             notification,
    //     //                             session: null 
    //     //                         });
    //     //                     }
    //     //                 } catch (error) {
    //     //                     console.error(`Error finding session for sourceId ${sourceId}:`, error);
    //     //                     updatedNotifications.push({
    //     //                         notification,
    //     //                         session: null 
    //     //                     });
    //     //                 }
    //     //                 break;

    //     //             case 'message':
    //     //                 console.log(`Processing message for sourceId ${sourceId}`);
    //     //                 updatedNotifications.push({
    //     //                     notification,
    //     //                     relatedData: null
    //     //                 });
    //     //                 break;

    //     //             case 'post':
    //     //                 console.log(`Processing post for sourceId ${sourceId}`);
    //     //                 updatedNotifications.push({
    //     //                     notification,
    //     //                     relatedData: null
    //     //                 });
    //     //                 break;

    //     //             case 'event':
                      
    //     //                 console.log(`Processing event for sourceId ${sourceId}`);
                       
    //     //                 updatedNotifications.push({
    //     //                     notification,
    //     //                     relatedData: null
    //     //                 });
    //     //                 break;

    //     //             case 'service':
                       
    //     //                 console.log(`Processing service for sourceId ${sourceId}`);
                        
    //     //                 updatedNotifications.push({
    //     //                     notification,
    //     //                     relatedData: null 
    //     //                 });
    //     //                 break;

    //     //             case 'booking':
                       
    //     //                 console.log(`Processing booking for sourceId ${sourceId}`);
                        
    //     //                 updatedNotifications.push({
    //     //                     notification,
    //     //                     relatedData: null 
    //     //                 });
    //     //                 break;

    //     //             case 'un-follow':
                        
    //     //                 console.log(`Processing un-follow for sourceId ${sourceId}`);
                        
    //     //                 updatedNotifications.push({
    //     //                     notification,
    //     //                     relatedData: null 
    //     //                 });
    //     //                 break;

    //     //             default:
    //     //                 console.log(`Unknown related type: ${relatedType}`);
    //     //                 updatedNotifications.push({
    //     //                     notification,
    //     //                     relatedData: null 
    //     //                 });
    //     //                 break;
    //     //         }
    //     //     }));
    //     // }
    //  } 
       
        const notificationUpdated = await updateNotifications({ 'receivers.user': req.user.id }, {
            $set: { 'receivers.$.isRead': true }
        });
        console.log("🚀 ~ exports.getNotifications= ~ notificationUpdated:", notificationUpdated)

        const some = await user_notification_count({ userId: req.user.id });
        console.log("🚀 ~ exports.getNotifications= ~ some:", some)
        generateResponse(notifications, "notifications", res);
    } catch (e) {
        
        next(new Error(e.message));
    }
};
