const { Types } = require("mongoose");

exports.getChatListQuery = (userId) => {
  return [
    {
      $match: {
        lastMessage: { $exists: true },
        users: new Types.ObjectId(userId),
        deletedBy: { $ne: new Types.ObjectId(userId) },
      },
    },

    {
      $lookup: {
        from: "users",
        let: { users: "$users" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$users"] },
                  { $ne: ["$_id", new Types.ObjectId(userId)] },
                ],
              },
            },
          },
        ],
        as: "chat",
      },
    },
    { $unwind: { path: "$chat", preserveNullAndEmptyArrays: true } },

    // Lookup userProfile
    {
      $lookup: {
        from: "userprofiles",
        localField: "chat.profileId",
        foreignField: "_id",
        as: "userProfile",
      },
    },
    {
      $lookup: {
        from: "orgprofiles",
        localField: "chat.profileId",
        foreignField: "_id",
        as: "organizationProfile",
      },
    },
    {
      $addFields: {
        "chat.profileId": {
          $cond: {
            if: { $gt: [{ $size: "$userProfile" }, 0] },
            then: { $arrayElemAt: ["$userProfile", 0] },
            else: { $arrayElemAt: ["$organizationProfile", 0] },
          },
        },
      },
    },
    {
      $lookup: {
        from: "media",
        localField: "chat.profileId.profileImage",
        foreignField: "_id",
        as: "chat.profileId.profileImage",
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "lastMessage",
        foreignField: "_id",
        as: "lastMessage",
      },
    },
    { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "messages",
        let: { channel: "$channel" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$channel", "$$channel"] }, // Same channel
                  { $eq: ["$isRead", false] }, // Unread messages
                  { $ne: ["$sender", new Types.ObjectId(userId)] }, // Not sent by the user
                ],
              },
            },
          },
        ],
        as: "unreadMessages",
      },
    },
    {
      $addFields: {
        unreadCount: { $size: "$unreadMessages" },
      },
    },
    {
      $project: {
        userProfile: 0,
        organizationProfile: 0,
        profileImage: 0,
        "chat.profileId.__v": 0,
        "chat.profileId.authId": 0,
        "chat.profileId.createdAt": 0,
        "chat.profileId.updatedAt": 0,
        "chat.profileId.bussinessCategory": 0,
        "chat.profileId.longitude": 0,
        "chat.profileId.latitude": 0,
        "chat.profileId.location": 0,
        "chat.profileId.portfolio": 0,
        "chat.profileId.address": 0,
        "chat.profileId.openTime": 0,
        "chat.profileId.closeTime": 0,
        "chat.profileId.gender": 0,
      },
    },
    { $project: { unreadMessages: 0 } },
  ];
};

exports.getMessagesWithPolls = (sessionId, loginUser) => {
  return [
    {
      $match: {
        sessionId: new Types.ObjectId(sessionId),
        isDeletedForEveryone: false,
        deletedBy: { $nin: [loginUser] },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "sender",
      },
    },
    { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },

    // Lookup sender profile details
    {
      $lookup: {
        from: "userprofiles",
        localField: "sender.profileId",
        foreignField: "_id",
        as: "sender.profileId",
      },
    },
    {
      $unwind: { path: "$sender.profileId", preserveNullAndEmptyArrays: true },
    },

    // Lookup sender profile image
    {
      $lookup: {
        from: "media",
        localField: "sender.profileId.profileImage",
        foreignField: "_id",
        as: "sender.profileId.profileImage",
      },
    },
    {
      $unwind: {
        path: "$sender.profileId.profileImage",
        preserveNullAndEmptyArrays: true,
      },
    },

    // Lookup the poll associated with the message
    {
      $lookup: {
        from: "polls",
        localField: "poll",
        foreignField: "_id",
        as: "poll",
      },
    },
    { $unwind: { path: "$poll", preserveNullAndEmptyArrays: true } },

    // Lookup services in the poll
    {
      $lookup: {
        from: "services",
        localField: "poll.services",
        foreignField: "_id",
        as: "poll.services",
      },
    },

    // Fetch media details for services in the poll
    {
      $lookup: {
        from: "media",
        localField: "poll.services.media",
        foreignField: "_id",
        as: "media",
      },
    },

    // Resolve media IDs to actual media objects in services
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  media: {
                    $map: {
                      input: "$$service.media",
                      as: "mediaId",
                      in: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$media",
                              as: "mediaItem",
                              cond: { $eq: ["$$mediaItem._id", "$$mediaId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Lookup votes for the poll and its services
    {
      $lookup: {
        from: "votepolls",
        let: { pollId: "$poll._id", serviceIds: "$poll.services._id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$poll", "$$pollId"] },
                  { $in: ["$serviceId", "$$serviceIds"] },
                ],
              },
            },
          },
        ],
        as: "votes",
      },
    },

    // Merge vote data into each service in the poll
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  votes: {
                    $filter: {
                      input: "$votes",
                      as: "vote",
                      cond: { $eq: ["$$vote.serviceId", "$$service._id"] },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Lookup users who voted for the services
    {
      $lookup: {
        from: "users",
        localField: "poll.services.votes.user",
        foreignField: "_id",
        as: "users",
      },
    },

    // Lookup user profiles
    {
      $lookup: {
        from: "userprofiles",
        localField: "users.profileId",
        foreignField: "_id",
        as: "userProfiles",
      },
    },

    // Lookup profile images for users based on profileId
    {
      $lookup: {
        from: "media",
        localField: "userProfiles.profileImage",
        foreignField: "_id",
        as: "profileImage",
      },
    },

    // Merge user details (profile and profileImage) into votes
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  votes: {
                    $map: {
                      input: "$$service.votes",
                      as: "vote",
                      in: {
                        $mergeObjects: [
                          "$$vote",
                          {
                            user: {
                              $let: {
                                vars: {
                                  user: {
                                    $arrayElemAt: [
                                      {
                                        $filter: {
                                          input: "$users",
                                          as: "user",
                                          cond: {
                                            $and: [
                                              {
                                                $eq: [
                                                  "$$user._id",
                                                  "$$vote.user",
                                                ],
                                              },
                                            ],
                                          },
                                        },
                                      },
                                      0,
                                    ],
                                  },
                                },
                                in: {
                                  $mergeObjects: [
                                    "$$user",
                                    {
                                      profileId: {
                                        $let: {
                                          vars: {
                                            profile: {
                                              $arrayElemAt: [
                                                {
                                                  $filter: {
                                                    input: "$userProfiles",
                                                    as: "profile",
                                                    cond: {
                                                      $eq: [
                                                        "$$profile._id",
                                                        "$$user.profileId",
                                                      ],
                                                    },
                                                  },
                                                },
                                                0,
                                              ],
                                            },
                                          },
                                          in: {
                                            $mergeObjects: [
                                              "$$profile",
                                              {
                                                profileImage: {
                                                  $arrayElemAt: [
                                                    {
                                                      $filter: {
                                                        input: "$profileImage",
                                                        as: "image",
                                                        cond: {
                                                          $eq: [
                                                            "$$image._id",
                                                            "$$profile.profileImage",
                                                          ],
                                                        },
                                                      },
                                                    },
                                                    0,
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Project the final output with necessary fields
    {
      $project: {
        poll: {
          $cond: {
            if: {
              $arrayElemAt: ["$poll.services", 0],
            },
            then: {
              _id: "$poll._id",
              pollingStatus : "$poll.pollingStatus",
              services: {
                $cond: {
                  if: {
                    $isArray: "$poll.services",
                  },
                  then: "$poll.services",
                  else: [],
                },
              },
            },
            else: null,
          },
        },
        sender: 1,
        text: 1,
        sessionId: 1,
        channelId: 1,
        createdAt: 1,
        updatedAt: 1,
        type: 1,
        isRead: 1,
      },
    },
  ];
};

exports.getUpdatedMessagesWithPollsAndVotes = (channelId, message_id, loginUser) => {
  return [
    // Match messages based on sessionId and other conditions
    {
      $match: {
        sessionId: new Types.ObjectId(channelId),
        isDeletedForEveryone: false,
        _id : new Types.ObjectId(message_id),
        deletedBy: { $nin: [loginUser] },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "sender",
      },
    },
    { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },

    // Lookup sender profile details
    {
      $lookup: {
        from: "userprofiles",
        localField: "sender.profileId",
        foreignField: "_id",
        as: "sender.profileId",
      },
    },
    {
      $unwind: { path: "$sender.profileId", preserveNullAndEmptyArrays: true },
    },

    // Lookup sender profile image
    {
      $lookup: {
        from: "media",
        localField: "sender.profileId.profileImage",
        foreignField: "_id",
        as: "sender.profileId.profileImage",
      },
    },
    {
      $unwind: {
        path: "$sender.profileId.profileImage",
        preserveNullAndEmptyArrays: true,
      },
    },

    // Lookup the poll associated with the message
    {
      $lookup: {
        from: "polls",
        localField: "poll",
        foreignField: "_id",
        as: "poll",
      },
    },
    { $unwind: { path: "$poll", preserveNullAndEmptyArrays: true } },

    // Lookup services in the poll
    {
      $lookup: {
        from: "services",
        localField: "poll.services",
        foreignField: "_id",
        as: "poll.services",
      },
    },

    // Fetch media details for services in the poll
    {
      $lookup: {
        from: "media",
        localField: "poll.services.media",
        foreignField: "_id",
        as: "media",
      },
    },

    // Resolve media IDs to actual media objects in services
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  media: {
                    $map: {
                      input: "$$service.media",
                      as: "mediaId",
                      in: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$media",
                              as: "mediaItem",
                              cond: { $eq: ["$$mediaItem._id", "$$mediaId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Lookup votes for the poll and its services
    {
      $lookup: {
        from: "votepolls",
        let: { pollId: "$poll._id", serviceIds: "$poll.services._id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$poll", "$$pollId"] },
                  { $in: ["$serviceId", "$$serviceIds"] },
                ],
              },
            },
          },
        ],
        as: "votes",
      },
    },

    // Merge vote data into each service in the poll
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  votes: {
                    $filter: {
                      input: "$votes",
                      as: "vote",
                      cond: { $eq: ["$$vote.serviceId", "$$service._id"] },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Lookup users who voted for the services
    {
      $lookup: {
        from: "users",
        localField: "poll.services.votes.user",
        foreignField: "_id",
        as: "users",
      },
    },

    // Lookup user profiles
    {
      $lookup: {
        from: "userprofiles",
        localField: "users.profileId",
        foreignField: "_id",
        as: "userProfiles",
      },
    },

    // Lookup profile images for users based on profileId
    {
      $lookup: {
        from: "media",
        localField: "userProfiles.profileImage",
        foreignField: "_id",
        as: "profileImage",
      },
    },

    // Merge user details (profile and profileImage) into votes
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  votes: {
                    $map: {
                      input: "$$service.votes",
                      as: "vote",
                      in: {
                        $mergeObjects: [
                          "$$vote",
                          {
                            user: {
                              $let: {
                                vars: {
                                  user: {
                                    $arrayElemAt: [
                                      {
                                        $filter: {
                                          input: "$users",
                                          as: "user",
                                          cond: {
                                            $and: [
                                              {
                                                $eq: [
                                                  "$$user._id",
                                                  "$$vote.user",
                                                ],
                                              },
                                            ],
                                          },
                                        },
                                      },
                                      0,
                                    ],
                                  },
                                },
                                in: {
                                  $mergeObjects: [
                                    "$$user",
                                    {
                                      profileId: {
                                        $let: {
                                          vars: {
                                            profile: {
                                              $arrayElemAt: [
                                                {
                                                  $filter: {
                                                    input: "$userProfiles",
                                                    as: "profile",
                                                    cond: {
                                                      $eq: [
                                                        "$$profile._id",
                                                        "$$user.profileId",
                                                      ],
                                                    },
                                                  },
                                                },
                                                0,
                                              ],
                                            },
                                          },
                                          in: {
                                            $mergeObjects: [
                                              "$$profile",
                                              {
                                                profileImage: {
                                                  $arrayElemAt: [
                                                    {
                                                      $filter: {
                                                        input: "$profileImage",
                                                        as: "image",
                                                        cond: {
                                                          $eq: [
                                                            "$$image._id",
                                                            "$$profile.profileImage",
                                                          ],
                                                        },
                                                      },
                                                    },
                                                    0,
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Project the final output with necessary fields
    {
      $project: {
        poll: {
          $cond: {
            if: {
              $arrayElemAt: ["$poll.services", 0],
            },
            then: {
              _id: "$poll._id",
              services: {
                $cond: {
                  if: {
                    $isArray: "$poll.services",
                  },
                  then: "$poll.services",
                  else: [],
                },
              },
            },
            else: null,
          },
        },
        sender: 1,
        text: 1,
        sessionId: 1,
        channelId: 1,
        createdAt: 1,
        updatedAt: 1,
        type: 1,
        isRead: 1,
      },
    },
  ];
};

exports.getMessageAggregation = (messageId, sessionId, loginUser) => {
  return [
    {
      // Match messages based on sessionId and other conditions
      $match: {
        _id: new Types.ObjectId(messageId), // Matching the message ID
        // sessionId: new Types.ObjectId(sessionId), // Matching the sessionId
        isDeletedForEveryone: false,
        deletedBy: { $nin: [loginUser] }, // Ensure the message isn't deleted for the user
      },
    },
    // Lookup the sender's user details
    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "sender",
      },
    },
    { $unwind: { path: "$sender" } },

    // Lookup the sender's profileId (user profile details)
    {
      $lookup: {
        from: "userprofiles",
        localField: "sender.profileId",
        foreignField: "_id",
        as: "sender.profileId",
      },
    },
    { $unwind: { path: "$sender.profileId" } },

    // Lookup the sender's profile image from the media collection
    {
      $lookup: {
        from: "media",
        localField: "sender.profileId.profileImage",
        foreignField: "_id",
        as: "sender.profileId.profileImage",
      },
    },
    { $unwind: { path: "$sender.profileId.profileImage" } },

    // Lookup the poll associated with the message
    {
      $lookup: {
        from: "polls",
        localField: "poll",
        foreignField: "_id",
        as: "poll",
      },
    },
    {
      $addFields: {
        poll: { $arrayElemAt: ["$poll", 0] }, // Extract the first element of the poll array
      },
    },

    // Lookup services in the poll
    {
      $lookup: {
        from: "services",
        localField: "poll.services",
        foreignField: "_id",
        as: "poll.services",
      },
    },

    // Fetch the media collection
    {
      $lookup: {
        from: "media",
        localField: "poll.services.media", // Use the media field in services
        foreignField: "_id",
        as: "media", // Name the result array as 'media'
      },
    },

    // Resolve media IDs to actual media objects in services
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  media: {
                    $map: {
                      input: "$$service.media", // Iterate over media objects
                      as: "mediaId",
                      in: {
                        $let: {
                          vars: {
                            mediaObj: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$media", // Reference the global media array fetched in $lookup
                                    as: "mediaItem",
                                    cond: {
                                      $eq: ["$$mediaItem._id", "$$mediaId"],
                                    },
                                  },
                                },
                                0, // Get the first matching media object
                              ],
                            },
                          },
                          in: "$$mediaObj",
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Lookup votes for the poll and its services
    {
      $lookup: {
        from: "votepolls",
        let: { pollId: "$poll._id", serviceIds: "$poll.services._id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$poll", "$$pollId"] },
                  { $in: ["$serviceId", "$$serviceIds"] },
                ],
              },
            },
          },
        ],
        as: "votes",
      },
    },

    // Merge vote data into each service in the poll
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  votes: {
                    $filter: {
                      input: "$votes",
                      as: "vote",
                      cond: { $eq: ["$$vote.serviceId", "$$service._id"] },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Lookup users who voted for the services
    {
      $lookup: {
        from: "users",
        localField: "poll.services.votes.user",
        foreignField: "_id",
        as: "users",
      },
    },

    // Lookup user profiles
    {
      $lookup: {
        from: "userprofiles",
        localField: "users.profileId",
        foreignField: "_id",
        as: "userProfiles",
      },
    },

    // Lookup profile images for users
    {
      $lookup: {
        from: "media",
        localField: "users.profileId.profileImage",
        foreignField: "_id",
        as: "images",
      },
    },

    // Merge user details (profile and profileImage) into votes
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  votes: {
                    $map: {
                      input: "$$service.votes",
                      as: "vote",
                      in: {
                        $mergeObjects: [
                          "$$vote",
                          {
                            user: {
                              $let: {
                                vars: {
                                  user: {
                                    $arrayElemAt: [
                                      {
                                        $filter: {
                                          input: "$users",
                                          as: "user",
                                          cond: {
                                            $eq: ["$$user._id", "$$vote.user"],
                                          },
                                        },
                                      },
                                      0,
                                    ],
                                  },
                                },
                                in: {
                                  $mergeObjects: [
                                    "$$user",
                                    {
                                      profileId: {
                                        $arrayElemAt: [
                                          {
                                            $filter: {
                                              input: "$userProfiles",
                                              as: "profile",
                                              cond: {
                                                $eq: [
                                                  "$$profile._id",
                                                  "$$user.profileId",
                                                ],
                                              },
                                            },
                                          },
                                          0,
                                        ],
                                      },
                                      profileImage: {
                                        $arrayElemAt: [
                                          {
                                            $filter: {
                                              input: "$images",
                                              as: "image",
                                              cond: {
                                                $eq: [
                                                  "$$image._id",
                                                  "$$user.profileId.profileImage",
                                                ],
                                              },
                                            },
                                          },
                                          0,
                                        ],
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Project the final output with necessary fields
    {
      $project: {
        poll: {
          $cond: {
            if: { $arrayElemAt: ["$poll.services", 0] },
            then: {
              _id: "$poll._id",
              services: {
                $cond: {
                  if: { $isArray: "$poll.services" },
                  then: "$poll.services",
                  else: [],
                },
              },
            },
            else: null,
          },
        },
        sender: 1,
        text: 1,
        sessionId: 1,
        channelId: 1,
        createdAt: 1,
        updatedAt: 1,
        type: 1,
        isRead: 1,
      },
    },
  ];
};

exports.getMessageWithPollVoteAndPercentage = (sessionId, messageId, loginUser) => {
  const matchQuery = {
    sessionId: new Types.ObjectId(sessionId),
    isDeletedForEveryone: false,
    deletedBy: { $nin: [loginUser] },
  };
  if (messageId) {
    matchQuery._id = new Types.ObjectId(messageId);
  }
  return [
    {
      $match: matchQuery
    },
    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "sender"
      }
    },
    {
      $unwind: {
        path: "$sender",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "userprofiles",
        localField: "sender.profileId",
        foreignField: "_id",
        as: "sender.profileId"
      }
    },
    {
      $unwind: {
        path: "$sender.profileId",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "media",
        localField: "sender.profileId.profileImage",
        foreignField: "_id",
        as: "sender.profileId.profileImage"
      }
    },
    {
      $unwind: {
        path: "$sender.profileId.profileImage",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "polls",
        localField: "poll",
        foreignField: "_id",
        as: "poll"
      }
    },
    {
      $unwind: {
        path: "$poll",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "services",
        localField: "poll.services",
        foreignField: "_id",
        as: "poll.services"
      }
    },
    {
      $lookup: {
        from: "media",
        localField: "poll.services.media",
        foreignField: "_id",
        as: "media"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "poll.services.user",
        foreignField: "_id",
        as: "userData"
      }
    },
    {
      $lookup: {
        from: "orgprofiles",
        localField: "userData.profileId",
        foreignField: "_id",
        as: "serviceOrgProfile"
      }
    },
    {
      $lookup: {
        from: "media",
        localField:
          "serviceOrgProfile.profileImage",
        foreignField: "_id",
        as: "serviceProfileImage"
      }
    },
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  media: {
                    $map: {
                      input: "$$service.media",
                      as: "mediaId",
                      in: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$media",
                              as: "mediaItem",
                              cond: {
                                $eq: [
                                  "$$mediaItem._id",
                                  "$$mediaId"
                                ]
                              }
                            }
                          },
                          0
                        ]
                      }
                    }
                  },
                  user: {
                    $let: {
                      vars: {
                        user: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$userData",
                                as: "user",
                                cond: {
                                  $eq: [
                                    "$$user._id",
                                    "$$service.user"
                                  ]
                                }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: {
                        $mergeObjects: [
                          "$$user",
                          {
                            profileId: {
                              $let: {
                                vars: {
                                  profile: {
                                    $arrayElemAt: [
                                      {
                                        $filter: {
                                          input:
                                            "$serviceOrgProfile",
                                          as: "profile",
                                          cond: {
                                            $eq: [
                                              "$$profile._id",
                                              "$$user.profileId"
                                            ]
                                          }
                                        }
                                      },
                                      0
                                    ]
                                  }
                                },
                                in: {
                                  $mergeObjects: [
                                    "$$profile",
                                    {
                                      profileImage:
                                        {
                                          $arrayElemAt:
                                            [
                                              {
                                                $filter:
                                                  {
                                                    input:
                                                      "$serviceProfileImage",
                                                    as: "image",
                                                    cond: {
                                                      $eq: [
                                                        "$$image._id",
                                                        "$$profile.profileImage"
                                                      ]
                                                    }
                                                  }
                                              },
                                              0
                                            ]
                                        }
                                    }
                                  ]
                                }
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: "votepolls",
        let: {
          pollId: "$poll._id",
          serviceIds: "$poll.services._id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$poll", "$$pollId"] },
                  {
                    $in: [
                      "$serviceId",
                      "$$serviceIds"
                    ]
                  }
                ]
              }
            }
          }
        ],
        as: "votes"
      }
    },
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  votes: {
                    $filter: {
                      input: "$votes",
                      as: "vote",
                      cond: {
                        $eq: [
                          "$$vote.serviceId",
                          "$$service._id"
                        ]
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "poll.services.votes.user",
        foreignField: "_id",
        as: "users"
      }
    },
    {
      $lookup: {
        from: "userprofiles",
        localField: "users.profileId",
        foreignField: "_id",
        as: "userProfiles"
      }
    },
    {
      $lookup: {
        from: "media",
        localField: "userProfiles.profileImage",
        foreignField: "_id",
        as: "profileImage"
      }
    },
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  votes: {
                    $map: {
                      input: "$$service.votes",
                      as: "vote",
                      in: {
                        $mergeObjects: [
                          "$$vote",
                          {
                            user: {
                              $let: {
                                vars: {
                                  user: {
                                    $arrayElemAt: [
                                      {
                                        $filter: {
                                          input:
                                            "$users",
                                          as: "user",
                                          cond: {
                                            $and: [
                                              {
                                                $eq: [
                                                  "$$user._id",
                                                  "$$vote.user"
                                                ]
                                              }
                                            ]
                                          }
                                        }
                                      },
                                      0
                                    ]
                                  }
                                },
                                in: {
                                  $mergeObjects: [
                                    "$$user",
                                    {
                                      profileId: {
                                        $let: {
                                          vars: {
                                            profile:
                                              {
                                                $arrayElemAt:
                                                  [
                                                    {
                                                      $filter:
                                                        {
                                                          input:
                                                            "$userProfiles",
                                                          as: "profile",
                                                          cond: {
                                                            $eq: [
                                                              "$$profile._id",
                                                              "$$user.profileId"
                                                            ]
                                                          }
                                                        }
                                                    },
                                                    0
                                                  ]
                                              }
                                          },
                                          in: {
                                            $mergeObjects:
                                              [
                                                "$$profile",
                                                {
                                                  profileImage:
                                                    {
                                                      $arrayElemAt:
                                                        [
                                                          {
                                                            $filter:
                                                              {
                                                                input:
                                                                  "$profileImage",
                                                                as: "image",
                                                                cond: {
                                                                  $eq: [
                                                                    "$$image._id",
                                                                    "$$profile.profileImage"
                                                                  ]
                                                                }
                                                              }
                                                          },
                                                          0
                                                        ]
                                                    }
                                                }
                                              ]
                                          }
                                        }
                                      }
                                    }
                                  ]
                                }
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $addFields: {
        "poll.totalVotes": {
          $reduce: {
            input: "$poll.services",
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                { $size: "$$this.votes" }
              ]
            }
          }
        }
      }
    },
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  votingPercentage: {
                    $cond: {
                      if: {
                        $gt: ["$poll.totalVotes", 0]
                      },
                      then: {
                        $round: [
                          {
                            $multiply: [
                              {
                                $divide: [
                                  {
                                    $size:
                                      "$$service.votes"
                                  },
                                  "$poll.totalVotes"
                                ]
                              },
                              10
                            ]
                          },
                          2
                        ]
                      },
                      else: 0
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $project: {
        poll: {
          $cond: {
            if: {
              $arrayElemAt: ["$poll.services", 0]
            },
            then: {
              _id: "$poll._id",
              pollingStatus : "$poll.pollingStatus",
              services: {
                $cond: {
                  if: {
                    $isArray: "$poll.services"
                  },
                  then: "$poll.services",
                  else: []
                }
              }
            },
            else: null
          }
        },
        sender: 1,
        text: 1,
        sessionId: 1,
        channelId: 1,
        createdAt: 1,
        updatedAt: 1,
        type: 1,
        isRead: 1
      }
    }
  ]
}



exports.getMessageAggregationwithDetail = (messageId = null, sessionId, loginUser) => {
  const matchQuery = {
    sessionId: new Types.ObjectId(sessionId),
    isDeletedForEveryone: false,
    deletedBy: { $nin: [loginUser] },
  };  
  if (messageId) {
    matchQuery._id = new Types.ObjectId(messageId);
  }
  return [
    {
      $match: matchQuery
    },
    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "sender"
      }
    },
    {
      $unwind: {
        path: "$sender",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "userprofiles",
        localField: "sender.profileId",
        foreignField: "_id",
        as: "sender.profileId"
      }
    },
    {
      $unwind: {
        path: "$sender.profileId",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "media",
        localField: "sender.profileId.profileImage",
        foreignField: "_id",
        as: "sender.profileId.profileImage"
      }
    },
    {
      $unwind: {
        path: "$sender.profileId.profileImage",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "polls",
        localField: "poll",
        foreignField: "_id",
        as: "poll"
      }
    },
    {
      $unwind: {
        path: "$poll",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "services",
        localField: "poll.services",
        foreignField: "_id",
        as: "poll.services"
      }
    },
    {
      $lookup: {
        from: "media",
        localField: "poll.services.media",
        foreignField: "_id",
        as: "media"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "poll.services.user",
        foreignField: "_id",
        as: "userData"
      }
    },
    {
      $lookup: {
        from: "orgprofiles",
        localField: "userData.profileId",
        foreignField: "_id",
        as: "serviceOrgProfile"
      }
    },
    {
      $lookup: {
        from: "media",
        localField:
          "serviceOrgProfile.profileImage",
        foreignField: "_id",
        as: "serviceProfileImage"
      }
    },
  
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  media: {
                    $map: {
                      input: "$$service.media",
                      as: "mediaId",
                      in: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$media",
                              as: "mediaItem",
                              cond: {
                                $eq: [
                                  "$$mediaItem._id",
                                  "$$mediaId"
                                ]
                              }
                            }
                          },
                          0
                        ]
                      }
                    }
                  },
                  user: {
                    $let: {
                      vars: {
                        user: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$userData",
                                as: "user",
                                cond: {
                                  $eq: [
                                    "$$user._id",
                                    "$$service.user"
                                  ]
                                }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: {
                        $mergeObjects: [
                          "$$user",
                          {
                            profileId: {
                              $let: {
                                vars: {
                                  profile: {
                                    $arrayElemAt: [
                                      {
                                        $filter: {
                                          input:
                                            "$serviceOrgProfile",
                                          as: "profile",
                                          cond: {
                                            $eq: [
                                              "$$profile._id",
                                              "$$user.profileId"
                                            ]
                                          }
                                        }
                                      },
                                      0
                                    ]
                                  }
                                },
                                in: {
                                  $mergeObjects: [
                                    "$$profile",
                                    {
                                      profileImage:
                                        {
                                          $arrayElemAt:
                                            [
                                              {
                                                $filter:
                                                  {
                                                    input:
                                                      "$serviceProfileImage",
                                                    as: "image",
                                                    cond: {
                                                      $eq: [
                                                        "$$image._id",
                                                        "$$profile.profileImage"
                                                      ]
                                                    }
                                                  }
                                              },
                                              0
                                            ]
                                        }
                                    }
                                  ]
                                }
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: "votepolls",
        let: {
          pollId: "$poll._id",
          serviceIds: "$poll.services._id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$poll", "$$pollId"] },
                  {
                    $in: [
                      "$serviceId",
                      "$$serviceIds"
                    ]
                  }
                ]
              }
            }
          }
        ],
        as: "votes"
      }
    },
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  votes: {
                    $filter: {
                      input: "$votes",
                      as: "vote",
                      cond: {
                        $eq: [
                          "$$vote.serviceId",
                          "$$service._id"
                        ]
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "poll.services.votes.user",
        foreignField: "_id",
        as: "users"
      }
    },
    {
      $lookup: {
        from: "userprofiles",
        localField: "users.profileId",
        foreignField: "_id",
        as: "userProfiles"
      }
    },
    {
      $lookup: {
        from: "media",
        localField: "userProfiles.profileImage",
        foreignField: "_id",
        as: "profileImage"
      }
    },
    {
      $addFields: {
        "poll.services": {
          $map: {
            input: "$poll.services",
            as: "service",
            in: {
              $mergeObjects: [
                "$$service",
                {
                  votes: {
                    $map: {
                      input: "$$service.votes",
                      as: "vote",
                      in: {
                        $mergeObjects: [
                          "$$vote",
                          {
                            user: {
                              $let: {
                                vars: {
                                  user: {
                                    $arrayElemAt: [
                                      {
                                        $filter: {
                                          input:
                                            "$users",
                                          as: "user",
                                          cond: {
                                            $and: [
                                              {
                                                $eq: [
                                                  "$$user._id",
                                                  "$$vote.user"
                                                ]
                                              }
                                            ]
                                          }
                                        }
                                      },
                                      0
                                    ]
                                  }
                                },
                                in: {
                                  $mergeObjects: [
                                    "$$user",
                                    {
                                      profileId: {
                                        $let: {
                                          vars: {
                                            profile:
                                              {
                                                $arrayElemAt:
                                                  [
                                                    {
                                                      $filter:
                                                        {
                                                          input:
                                                            "$userProfiles",
                                                          as: "profile",
                                                          cond: {
                                                            $eq: [
                                                              "$$profile._id",
                                                              "$$user.profileId"
                                                            ]
                                                          }
                                                        }
                                                    },
                                                    0
                                                  ]
                                              }
                                          },
                                          in: {
                                            $mergeObjects:
                                              [
                                                "$$profile",
                                                {
                                                  profileImage:
                                                    {
                                                      $arrayElemAt:
                                                        [
                                                          {
                                                            $filter:
                                                              {
                                                                input:
                                                                  "$profileImage",
                                                                as: "image",
                                                                cond: {
                                                                  $eq: [
                                                                    "$$image._id",
                                                                    "$$profile.profileImage"
                                                                  ]
                                                                }
                                                              }
                                                          },
                                                          0
                                                        ]
                                                    }
                                                }
                                              ]
                                          }
                                        }
                                      }
                                    }
                                  ]
                                }
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
        $addFields: {
          "poll.totalVotes": {
            $reduce: {
              input: "$poll.services",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  { $size: "$$this.votes" }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          "poll.services": {
            $map: {
              input: "$poll.services",
              as: "service",
              in: {
                $mergeObjects: [
                  "$$service",
                  {
                    votingPercentage: {
                      $cond: {
                        if: {
                          $gt: ["$poll.totalVotes", 0]
                        },
                        then: {
                          $round: [
                            {
                              $multiply: [
                                {
                                  $divide: [
                                    {
                                      $size:
                                        "$$service.votes"
                                    },
                                    "$poll.totalVotes"
                                  ]
                                },
                                10
                              ]
                            },
                            2
                          ]
                        },
                        else: 0
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
    {
      $addFields: {
        recommendedService: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$poll.services",
                as: "service",
                cond: {
                  $eq: [
                    "$$service.votingPercentage",
                    { $max: "$poll.services.votingPercentage" },
                  ],
                },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        poll: {
          $cond: {
            if: {
              $arrayElemAt: ["$poll.services", 0]
            },
            then: {
              _id: "$poll._id",
              pollingStatus: "$poll.pollingStatus",
              services: {
                $cond: {
                  if: {
                    $isArray: "$poll.services"
                  },
                  then: "$poll.services",
                  else: []
                }
              },
             recommendedService: {
              $cond: {
                if: { $eq: ["$poll.pollingStatus", "In-progress"] },
                then: null,
                else: "$recommendedService"
              }
            }
            },
            else: null
          }
        },
        sender: 1,
        text: 1,
        sessionId: 1,
        channelId: 1,
        createdAt: 1,
        updatedAt: 1,
        type: 1,
        isRead: 1,
      }
    }
  ];
}