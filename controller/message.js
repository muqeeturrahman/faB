const { generateResponse, parseBody } = require("../utils");
const {
  createMessage,
  findMessageById,
  findMessages,
  getMessages, // without pagination
  unSeenMessageCountQuery,
  updateMessageById,
  deleteMessageById,
  unSeenMessageCountByChannelQuery,
  getMessageWithDetails,
  findMessageByAggregate,
} = require("../models/messageModel");
const {
  addPoll,
  getSinglePoll,
  updatePollById,
  updatePoll,
  updatePollStatusByID,
} = require("../models/pollModel");
const { votePoll, getVote, deleteVote } = require("../models/votePoll");
const {
  STATUS_CODE,
  NOTIFICATION_TYPE,
  MESSAGE_TYPE,
} = require("../utils/constants");
const {
  sendMessageIO,
  seenMessageIO,
  deleteMessageForAllIO,
  unSeenMessageCount,
  unSeenMessageCountChannel,
  chatUnReadCount,
  resetChatIO,
  updateVoteMessageIO,
  sendMessageForSpecificSessionIO,
} = require("../socket/socket");
const {
  updateChat,
  createChat,
  findChats,
  findChat,
  removeChat,
} = require("../models/chatModel");
const {
  getChatListQuery,
  getMessagesWithPolls,
  getMessageAggregation,
  getUpdatedMessagesWithPollsAndVotes,
  getMessageWithPollVoteAndPercentage,
  getMessageAggregationwithDetail,
} = require("../queries/message");
const { sendMessageValidation } = require("../validations/messageValidation");
const { Types } = require("mongoose");
const { createAndSendNotification1 } = require("../models/notificationModel");
const { findUser } = require("../models/user");
const { ChatModel, chatUnSeenCount } = require("../models/chatModel");
const { findBlockUser } = require("../models/blockModel");
const { populateSender } = require("../utils/helper");
const path = require("path");
const { populate } = require("dotenv");
const { channel } = require("diagnostics_channel");
const { generateUniqueID } = require("../utils/helper");
const { findSessionbyid } = require("../models/sessionModel");

exports.sendMessage = async (req, res, next) => {
  const { receiver, parent, text, channelId, type, serviceId, sessionId, ticketId } =
    parseBody(req.body);
  // const { error } = sendMessageValidation.validate(req.body);
  // if (error) {
  //     return next({
  //         statusCode: STATUS_CODE.UNPROCESSABLE_ENTITY,
  //         message: error.details[0].message
  //     });
  // }
  const sender = req.user.id;
  let media = [];
  if (req.files?.media?.length > 0) {
    req.files?.media.forEach((file) =>
      media.push(`messages/${file?.filename}`)
    );
  }

  try {
    // check if user is blocked
    // const isBlocked = await findBlockUser({
    //     $or: [
    //         { blockId: sender, userId: receiver },
    //         { blockId: receiver, userId: sender }
    //     ],
    // });

    // if (isBlocked) return next({
    //     statusCode: STATUS_CODE.CONTENT_NOT_AVAILABLE,
    //     message: 'Blocked user'
    // });

    // find created channel or create new channel
    // let isChannel = await findChat({
    //     $or: [{ channel: `${sender}-${receiver}` }, { channel: `${receiver}-${sender}` }]
    // });
    console.log("api is hitting");
    let pollId;
    if (type && type === "poll") {
      let poll = await addPoll({ services: serviceId, user: req.user.id });
      pollId = poll._id;
    }

    let isChannel = await findChat({
      channel: channelId,
    });

    if (isChannel) {
      if (isChannel.deletedBy) {
        await updateChat(
          { _id: isChannel?._id },
          {
            $unset: { deletedBy: isChannel.deletedBy },
          }
        );
      }
    }

    let channel;

    const uniqueId = generateUniqueID();
    if (!isChannel) {
      // create chat / new channel
      channel = `${uniqueId}`;
      const chat = await createChat({
        users: [sender, ...receiver],
        channel,
      });
    } else channel = isChannel?.channel;

    const messageData = { sender, channel, media, receiver, sessionId, ticketId };
    if (parent) {
      messageData.parent = parent;
    }
    if (text) {
      messageData.text = text;
    }

    if (type && type == "poll") {
      messageData.poll = pollId;
      messageData.type = MESSAGE_TYPE.POLL;
    }
    const message = await createMessage(messageData);

    // update last message in chat
    await updateChat({ channel }, { lastMessage: message._id });
    let resetChats = await ResetChatList(sender);
    receiver.map(async (e) => {
      let resetChatsReciever = await ResetChatList(e);
      resetChatIO(e, resetChatsReciever);
    });

    resetChatIO(sender, resetChats);

    if (message) {
      let messageQuery = getMessageAggregation(message._id, sessionId, sender);
      let newMessage = await getMessageWithDetails(messageQuery);

      receiver.map(async (e) => {
        const unSeenMessageCountByChannel =
          await unSeenMessageCountByChannelQuery(e, channel);

        const receiverCount = await unSeenMessageCountQuery(e);

        sendMessageForSpecificSessionIO(e, session= sessionId, newMessage[0]);

        unSeenMessageCount(e, receiverCount);

        unSeenMessageCountChannel(e, unSeenMessageCountByChannel, channel);
      });

      // const chatUnSeenCountvalue =  chatUnSeenCount(receiver)

      // console.log('hehehehe', chatUnSeenCountvalue)

      // console.log(receiverCount ,"receiverCount")

      // send message socket

      // chatUnReadCount(receiver, chatUnSeenCountvalue)

      // send notification stuff here!
      // const senderObject = await findUser({ _id: newMessage?.sender });
      // const receiverIds = receiver;
      // const type = NOTIFICATION_TYPE.MESSAGE_SENT;
      // console.log("this is channel", channel)
      // await createAndSendNotification1({ senderObject, receiverIds, type, relatedId: channelId, relatedType: "message" });
      generateResponse(newMessage[0], "Message Send successfully", res);
    }
  } catch (error) {
    next(new Error(error.message));
  }
};

const ResetChatList = async (userId) => {
  const page = 1;
  // const searchText = req.query.search_text || null;
  const limit = 100;

  const query = getChatListQuery(userId);
  // if (searchText) {
  //     query.push({
  //         $match: {
  //             "chat.fullName": {
  //                 $regex: searchText,
  //                 $options: "i" // Case-insensitive match
  //             }
  //         }
  //     });
  // }

  try {
    const chats = await findChats({
      query,
      page,
      limit,
      populate: [
        {
          path: "sender",
          //   populate: {
          //     path: 'ssn_image profileImage',
          //   },
        },
      ],
    });
    // if (chats?.result?.length === 0 || !chats) {
    //     generateResponse(null, "No chats found", res);
    //     return;
    // }
    return chats;
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.getChatList = async (req, res, next) => {
  const userId = req.user.id;
  const page = req.query.page || 1;
  const searchText = req.query.search_text || null;
  const limit = req.query.limit || 10;

  const query = getChatListQuery(userId, searchText);
  if (searchText) {
    query.push({
      $match: {
        "chat.fullName": {
          $regex: searchText,
          $options: "i",
        },
      },
    });
  }

  try {
    const chats = await findChats({
      query,
      page,
      limit,
      populate: [
        {
          path: "sender",
          //   populate: {
          //     path: 'ssn_image profileImage',
          //   },
        },
      ],
    });
    // if (chats?.result?.length === 0 || !chats) {
    //     generateResponse(null, "No chats found", res);
    //     return;
    // }

    generateResponse(chats, "Chats fetched successfully", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { channelId, sessionId } = req.query;
    const loginUser = req.user.id;

    // Build query for messages in the given channel, not deleted/flagged by user
    let query = {
      sessionId: sessionId,
      deletedBy: { $nin: [loginUser] },
      flaggedBy: { $nin: [loginUser] },
    };

    // Mark unread messages as read and emit seen event
    const unreadQuery = {
      ...query,
      isRead: false,
    };
    const messageForSeen = await getMessages(unreadQuery);

    if (messageForSeen.length > 0) {
      for (const e of messageForSeen) {
        const message = await updateMessageById(e._id, {
          $set: { isRead: true },
        });
        seenMessageIO(message);
      }
    }

    // Reset chat list for all users in the channel
    let Channel = await findChat({ channel: channelId });
    if (Channel?.users && Channel.users.length > 0) {
      for (const e of Channel.users) {
        let resetChats = await ResetChatList(e._id || e);
        resetChatIO(e._id || e, resetChats);
      }
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Find messages with pagination
    const messagesData = await findMessages({
      query,
      page,
      limit,
      populate: [
        {
          path: "sender",
        }
      ],
    });

    generateResponse(messagesData, "Messages fetched successfully", res);
  } catch (error) {
    console.log(error, "error>>>");
    next(new Error(error.message));
  }
};

// exports.votePoll = async (req, res, next) => {
//   try {
//     // votePoll, getVote, deleteVote
//     const { poll, serviceId, sessionId, messageId } = req.body;
//     const user = req.user.id;
//     const page = 1;
//     const limit = 10;
//     const findPoll = await getSinglePoll({ _id: poll });
//     if (!findPoll) {
//       return next({
//         statusCode: STATUS_CODE.NOT_FOUND,
//         message: "Poll not found",
//       });
//     }
//     const getRecieverList = await findMessageById(messageId);
//     if (!getRecieverList) {
//       return next({
//         statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
//         message: "No message found for the message Id",
//       });
//     }
//     let findVote = await getVote({ poll, serviceId, user });
//     if (findVote.length !== 0) {
//       const AlreadyVote = await deleteVote({ poll, user });
//       query = getMessageAggregationwithDetail(messageId , sessionId, user);
//       const messagesData = await findMessageByAggregate(query);
//       messagesData[0].poll.State = "Updated"
//       getRecieverList.receiver.forEach((receiver) => {
//         if (receiver) {
//           messagesData[0]['voter_Id'] = req?.user?.id; 
//           sendMessageIO(receiver, messagesData[0]);
//         }
//       });
//       generateResponse(AlreadyVote, "vote deleted", res);
//       return;
//     }

//     await deleteVote({ poll, user });
//     let addVote = await votePoll({
//       poll: poll,
//       serviceId: serviceId,
//       user: user,
//     });

//     query = getUpdatedMessagesWithPollsAndVotes(sessionId, messageId, user);
//     const messagesData = await findMessageByAggregate(query);
//     messagesData[0].poll.State= "Updated"
//     getRecieverList.receiver.forEach((receiver) => {
//       if (receiver) {
//         messagesData[0]['voter_Id'] = req?.user?.id;
//         sendMessageIO(receiver, messagesData[0]);
//       }
//     });
//     generateResponse(addVote, "vote added", res);
//   } catch (error) {
//     next(new Error(error.message));
//   }
// };

exports.deleteMessage = async (req, res, next) => {
  try {
    const user = req.user.id;

    const { messageId } = req.params;
    let message = await findMessageById(messageId);

    message = await updateMessageById(messageId, {
      $push: { deletedBy: user },
    });
    if (!message) {
      return next({
        statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
        message: "Message deletion failed",
      });
    }
    generateResponse(message, "message deleted", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.deleteMessageForEveryOne = async (req, res, next) => {
  const userId = req.user.id;
  const { messageId } = req.params;
  try {
    let message = await findMessageById(messageId);
    if (!message)
      return next({
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Message not found!",
      });
    if (message?.sender.toString() !== userId)
      return next({
        statusCode: STATUS_CODE.UNAUTHORIZED,
        message: "Message owner can only delete the message!",
      });
    message = await updateMessageById(messageId, {
      $set: { isDeletedForEveryone: true },
    });
    deleteMessageForAllIO(message);
    generateResponse(message, "message deleted for everyone!", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

exports.clearChat = async (req, res, next) => {
  const loginUser = req.user.id;
  const { user, channelId } = req.query;
  const query = {
    // $or: [
    //     { channel: `${user}-${loginUser}` },
    //     { channel: `${loginUser}-${user}` }
    // ]
    channel: channelId,
  };
  try {
    const messages = await getMessages(query);
    if (messages?.length == 0)
      return next({
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Message not found!",
      });
    messages.forEach(async (msg) => {
      if (
        Types.ObjectId.isValid(msg?.deletedBy) &&
        msg?.deletedBy.toString() !== loginUser
      ) {
        await deleteMessageById(msg?._id);
      } else {
        await updateMessageById(msg?._id, { $push: { deletedBy: loginUser } });
      }
    });
    generateResponse(null, "clear chat", res);
  } catch (error) {
    next(new Error(error.message));
  }
};

// exports.removeChat = async (req, res, next) => {
//     const loginUser = req.user.id
//     const { user } = req.query
//     const query = {
//         $or: [
//             { channel: `${user}-${loginUser}` },
//             { channel: `${loginUser}-${user}` }
//         ]
//     }
//     try {
//         const messages = await getMessages(query)
//         if (messages?.length == 0) return next({
//             statusCode: STATUS_CODE.NOT_FOUND,
//             message: "Message not found"
//         })
//         messages.forEach(async (msg) => {
//             if (Types.ObjectId.isValid(msg?.deletedBy) && msg?.deletedBy.toString() !== loginUser) {
//                 await deleteMessageById(msg?._id)
//             }
//             else {
//                 await updateMessageById(msg?._id, { $set: { deletedBy: loginUser } })
//             }
//         })
//         let chat = await findChat(query)
//         if (Types.ObjectId.isValid(chat?.deletedBy) && chat?.deletedBy.toString() !== loginUser) {
//             chat = await removeChat(chat?._id)
//         }
//         else {
//             chat = await updateChat({ _id: chat?._id }, { $set: { deletedBy: loginUser } })
//         }
//         generateResponse(null, "clear chat", res)
//     }
//     catch (error) {
//         next(new Error(error.message));
//     }
// }

exports.getPollDetails = async (req, res, next) => {
  try {
    // votePoll, getVote, deleteVote
    const { sessionId, messageId } = req.body;
    const user = req.user.id;
    const findSession = await findSessionbyid({ _id: sessionId });
    if (!findSession) {
      return next({
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Session not found.",
      });
    }
    const findMessage = await findMessageById(messageId);
    if (!findMessage) {
      return next({
        statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
        message: "No message found.",
      });
    }

    const query = getMessageAggregationwithDetail(messageId ,sessionId, user)
    const messagesData = await findMessageByAggregate(query);
    if(!messagesData){
        return next({
            statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
            message: "Error fetching details.",
          });
    }
    generateResponse(messagesData[0], "Poll details fetched", res);

  } catch (error) {
    next(new Error(error.message));
  }
};


exports.updatePollStatus = async (req, res, next) => {
  try {
    const { pollId, messageId, sessionId } = req.body;
    const user = req.user.id;
    const findPoll = await getSinglePoll({ _id: pollId });
    if (!findPoll) {
      return next({
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Poll not found",
      });
    }
    const updatedPoll = await updatePollStatusByID(pollId, {pollingStatus: "Completed"})

    const query = getMessageAggregationwithDetail(messageId ,sessionId, user)
    const messagesData = await findMessageByAggregate(query);
    const getRecieverList = await findMessageById(messageId);
    if (!getRecieverList) {
      return next({
        statusCode: STATUS_CODE.INTERNAL_SERVER_ERROR,
        message: "No message found for the message Id",
      });
    }
    messagesData[0].poll.State = "Updated"
    getRecieverList.receiver.forEach((receiver) => {
      if (receiver) {
        sendMessageForSpecificSessionIO(receiver, session = sessionId,messagesData[0]);
      }
    });

    generateResponse(updatedPoll, "Polling has been completed", res);
  } catch (error) {
    next(new Error(error.message));
  }
}