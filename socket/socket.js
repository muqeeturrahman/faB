const socketIO = require('socket.io');
const { updateUserById } = require('../models/user');
const { findMessageById, findMessageByAggregate } = require('../models/messageModel');
const { getSinglePoll } = require('../models/pollModel');
const { votePoll, getVote, deleteVote } = require("../models/votePoll");
const { getMessageAggregationwithDetail, getUpdatedMessagesWithPollsAndVotes } = require('../queries/message');
let io;

exports.io = (server) => {
  io = socketIO(server);
  io.on('connection', async (socket) => {
    const userObj = await updateUserById(socket.handshake?.headers?.user_id, { online: true });
    socket.broadcast.emit('user-connected', userObj);
    
    const userId = socket.handshake?.headers?.user_id;
    const sessionId = socket.handshake?.headers?.session_id;
    console.log(`User connected: ${userId} in session: ${sessionId}`);
    const eventName = `vote-poll-${userId}-session-${sessionId}`;

   socket.on(eventName, async (data, callback) => {
  try {
    const { poll, serviceId, sessionId, messageId } = data;

    // Validate the poll
    const findPoll = await getSinglePoll({ _id: poll });
    if (!findPoll) {
      return (
        typeof callback === "function" &&
        callback({
          statusCode: 404,
          message: "Poll not found",
        })
      );
    }

    // Fetch message and its receiver list
    const getRecieverList = await findMessageById(messageId);
    if (!getRecieverList) {
      return (
        typeof callback === "function" &&
        callback({
          statusCode: 500,
          message: "No message found for the provided message ID",
        })
      );
    }

    let findVote = await getVote({ poll, serviceId, user: userId });
    if (findVote.length !== 0) {
      const AlreadyVote = await deleteVote({ poll, user: userId });

      const query = getMessageAggregationwithDetail(
        messageId,
        sessionId,
        userId
      );
      const messagesData = await findMessageByAggregate(query);

      if (messagesData.length > 0) {
        messagesData[0].poll.State = "Updated";

        getRecieverList.receiver.forEach((receiver) => {
          if (receiver) {
            messagesData[0]["voter_Id"] = userId;
            this.sendMessageForSpecificSessionIO(
              receiver,
              sessionId,
              messagesData[0]
            );
          }
        });

        this.sendMessageForSpecificSessionIO(
          userId,
          sessionId,
          messagesData[0]
        );
      }

      return (
        typeof callback === "function" &&
        callback({ message: "Vote deleted", data: AlreadyVote })
      );
    }

    await deleteVote({ poll, user: userId });
    const addVote = await votePoll({
      poll: poll,
      serviceId: serviceId,
      user: userId,
    });

    const query = getUpdatedMessagesWithPollsAndVotes(
      sessionId,
      messageId,
      userId
    );
    const messagesData = await findMessageByAggregate(query);

    if (messagesData.length > 0) {
      messagesData[0].poll.State = "Updated";

      getRecieverList.receiver.forEach((receiver) => {
        if (receiver) {
          messagesData[0]["voter_Id"] = userId;
          this.sendMessageForSpecificSessionIO(
            receiver,
            sessionId,
            messagesData[0]
          );
        }
      });

      this.sendMessageForSpecificSessionIO(
        userId,
        sessionId,
        messagesData[0]
      );
    }

    return (
      typeof callback === "function" &&
      callback({ message: "Vote added", data: addVote })
    );
  } catch (error) {
    console.error("Error handling votePoll event:", error.message);
    return (
      typeof callback === "function" &&
      callback({ statusCode: 500, message: error.message })
    );
  }
});


    socket.on('disconnect', async () => {
      const userObj = await updateUserById(socket.handshake?.headers?.user_id, { online: false });
      socket.emit('user-disconnected', userObj);
    });
  });
};


exports.notificationCount = ({ count, userId }) => {
  // Emit an event with a unique identifier for the updated message
  io.emit(`notification-count-${userId}`, count);
};

exports.sendMessageIO = (receiver, message) => io.emit(`send-message-${receiver}`, message);
exports.sendMessageForSpecificSessionIO = (receiver,session, message) => io.emit(`send-message-${receiver}-session-${session}`, message);
exports.resetChatIO = (chatId, data) => io.emit(`reset-chat-${chatId}`, data);


exports.unSeenMessageCount = (receiver, count) => io.emit(`unseen-messages-count-${receiver}`, count);

exports.unSeenMessageCountChannel = (receiver, count,channel) => io.emit(`unseen-read-count-${receiver}`, {count,channel});

exports.sendRequest = (receiverId, data) => io.emit(`receive-request-${receiverId}`, data)
// exports.chatUnReadCount = (receiver, count) => io.emit(`unseen-chat-count-${receiver}`, count);
// seen message IO
exports.seenMessageIO = (message) => io.emit(`seen-message-${message._id}`, message);
// delete message for both
exports.deleteMessageForAllIO = (message) => io.emit(`delete-for-all-${message?._id}`, message);
// update message for all IO
exports.updateCommentForAllIO = (comment) => {
  // Emit an event with a unique identifier for the updated message
  io.emit(`update-message-for-all-${comment.postId}`, comment);
};
exports.createCommentForAllIO = (comment) => {
  // Emit an event with a unique identifier for the updated message
  io.emit(`create-message-for-all-${comment.postId}`, comment);
};
exports.deleteCommentForAllIO = (comment) => {
  // Emit an event with a unique identifier for the updated message
  io.emit(`delete-message-for-all-${comment}`, comment);
};

exports.sessionUpdates=(user,session,details)=>{
  io.emit(`session-updates-${user}-${session}`, details);
}