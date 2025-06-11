const { Types } = require("mongoose")
const {SERVICE_STATUS} = require("../utils/constants")
exports.searchServiceQuery = (userId, q = "") => {
  return [
    {
      $match: {
        $and: [
          { user_id: { $ne: new Types.ObjectId(userId) } },
          {
            $or: [
              { title: { $regex: q, $options: "i" } },
              { address: { $regex: q, $options: "i" } },

            ]
          }
        ]
      }
    },
    {
      $addFields: { recommended: true } // Add the isRecommended field using $set
    },
    {
      $lookup: {
        from: "media",
        localField: "media",
        foreignField: "_id",
        as: "media"
      }
    },
    {
      $lookup: {
        from: "vibes",
        localField: "vibes",
        foreignField: "_id",
        as: "vibes"
      }
    },
    {
      $lookup: {
        from: "prefences",
        localField: "prefences",
        foreignField: "_id",
        as: "prefences"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $lookup: {
        from: "bookingreviews",
        localField: "_id",
        foreignField: "sourceId",
        as: "reviews"
      }
    },
    {
      $addFields: {
        averageRating: {
          $cond: {
            if: { $eq: [{ $size: "$reviews" }, 0] }, // Check if there are no reviews
            then: 0, // Set to 0 if there are no reviews
            else: { $avg: "$reviews.rating" } // Otherwise calculate the average
          }
        }
      }
    },
    {
      $match:{
        "user.isSubscribed": true
      }
    },
    {
      $unwind: {
        path: "$user"
      }
    },
    {
      $lookup: {
        from: "orgprofiles",
        localField: "user.profileId",
        foreignField: "_id",
        as: "orgProfile"
      }
    },
    {
      $lookup: {
        from: "userprofiles",
        localField: "user.profileId",
        foreignField: "_id",
        as: "userProfile"
      }
    },
    {
      $addFields: {
        "user.profileId": {
          $cond: {
            if: { $gt: [{ $size: "$orgProfile" }, 0] },
            then: { $arrayElemAt: ["$orgProfile", 0] },
            else: { $arrayElemAt: ["$userProfile", 0] }
          }
        }
      }
    },
    {
      $lookup: {
        from: "media",
        localField: "user.profileId.profileImage",
        foreignField: "_id",
        as: "user.profileId.profileImage"
      }
    },
    {
      $unwind: {
        path: "$user.profileId.profileImage"

      }
    },
    {
      $lookup: {
        from: "favorites",
        let: { serviceId: "$_id", loggedInUserId: new Types.ObjectId(userId) },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$$serviceId", "$serviceid"] }, // Check if serviceId exists in the serviceid array
                  { $eq: ["$userId", "$$loggedInUserId"] }
                ]
              }
            }
          }
        ],
        as: "isFavourite"
      }
    },
    {
      $addFields: {
        isFavourite: {
          $cond: {
            if: { $gt: [{ $size: "$isFavourite" }, 0] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        orgProfile: 0,
        userProfile: 0
      }
    },{
      $limit:1
    }
  ];
};


exports.getFavouriteList = (userId) => {
  return [
    {
      $match: {
        userId: new Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: "services",
        localField: "serviceid",
        foreignField: "_id",
        as: "serviceid"
      }
    },
    {
      $addFields: { "serviceid.recommended": true } // Add the isRecommended field using $set
    },
    {
      $unwind: {
        path: "$serviceid"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "serviceid.user",
        foreignField: "_id",
        as: "serviceid.user"
      }
    },
    {
      $unwind: {
        path: "$serviceid.user"
      }
    },
        {
      $lookup: {
        from: "userprofiles",
        localField: "serviceid.user.profileId",
        foreignField: "_id",
        as: "userProfile"
      }
    },
          {
      $lookup: {
        from: "orgprofiles",
        localField: "serviceid.user.profileId",
        foreignField: "_id",
        as: "orgProfile"
      }
    },
        {
        $addFields: {
          "serviceid.user.profileId": {
            $cond: {
              if: { $gt: [{ $size: "$orgProfile" }, 0] },
              then: { $arrayElemAt: ["$orgProfile", 0] },
              else: { $arrayElemAt: ["$userProfile", 0] }
            }
          }
        }
      },
        {
        $lookup: {
          from: "media",
          localField: "serviceid.media",
          foreignField: "_id",
          as: "serviceid.media"
        }
      },
      {
        $lookup: {
          from: "media",
          localField: "serviceid.user.profileId.profileImage",
          foreignField: "_id",
          as: "serviceid.user.profileId.profileImage"
        }
      },
        {
        $unwind: {
          path: "$serviceid.user.profileId.profileImage"
  
        }
      },
      {
        $lookup: {
          from: "favorites",
          let: { serviceId: "$serviceid._id", loggedInUserId: new Types.ObjectId(userId) },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$$serviceId", "$serviceid"] }, // Check if serviceId exists in the serviceid array
                    { $eq: ["$userId", "$$loggedInUserId"] }
                  ]
                }
              }
            }
          ],
          as: "isFavourite"
        }
      },
      {
        $addFields: {
          "serviceid.isFavourite": {
            $cond: {
              if: { $gt: [{ $size: "$isFavourite" }, 0] },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $lookup: {
          from: "bookingreviews",
          localField: "serviceid._id",
          foreignField: "sourceId",
          as: "reviews"
        }
      },
      {
        $addFields: {
          "serviceid.averageRating": {
            $cond: {
              if: { $gt: [{ $size: "$reviews" }, 0] }, // If there are reviews
              then: { $avg: "$reviews.rating" }, // Calculate the average rating
              else: 0 // Set to 0 if there are no reviews
            }
          }
        }
      },
      {
        $unwind: {
          path: "$reviews",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          orgProfile: 0,
          userProfile: 0,
          reviews: 0,
          isFavourite:0
        }
      }
  ]
}
exports.getBookingsVendor = (userId, status) => {
  return [
    {
      $match: {
        user: new Types.ObjectId(userId),
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "vendor"
      }

    },
    {
      $unwind: "$vendor"
    },
    {
      $lookup: {
        from: "orgprofiles",
        localField: "vendor.profileId",
        foreignField: "_id",
        as: "vendor.profileId"
      }

    },
    {
      $unwind: "$vendor.profileId"
    },
    {
      $lookup: {
        from: "media",
        localField: "vendor.profileId.profileImage",
        foreignField: "_id",
        as: "vendor.profileId.profileImage"
      }
    },
    {
      $unwind: "$vendor.profileId.profileImage"
    },
    {
      $lookup: {
        from: "media",
        localField: "media",
        foreignField: "_id",
        as: "media"
      }
    },
    {
      $lookup: {
        from: "bookings",
        localField: "_id",
        foreignField: "service",
        as: "bookings"
      }
    },
    {
      $unwind: "$bookings"
    },
    {
      $match: {
        "bookings.status": status
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "bookings.user",
        foreignField: "_id",
        as: "bookings.user"
      }
    },
    {
      $unwind: "$bookings.user"
    },
    {
      $lookup: {
        from: "userprofiles",
        localField: "bookings.user.profileId",
        foreignField: "_id",
        as: "bookings.user.profile"
      }
    },
    {
      $unwind: "$bookings.user.profile"
    },
    {
      $lookup: {
        from: "media",
        localField: "bookings.user.profile.profileImage",
        foreignField: "_id",
        as: "bookings.user.profile.profileImage"
      }
    },
    {
      $unwind: "$bookings.user.profile.profileImage"
    },
    
    // {
    //   $group: {
    //     _id: "$_id",
    //     title: { $first: "$title" },
    //     vendor: { $first: "$vendor" },
    //     activity_type: { $first: "$activity_type" },
    //     description: { $first: "$description" },
    //     location: { $first: "$location" },
    //     address: { $first: "$address" },
    //     startingDate: { $first: "$startingDate" },
    //     endingDate: { $first: "$endingDate" },
    //     budget: { $first: "$budget" },
    //     media: { $first: "$media" },
    //     clicksCount: { $first: "$clicksCount" },
    //     impressionCount: { $first: "$impressionCount" },
    //     status: { $first: "$status" },
    //     createdAt: { $first: "$createdAt" },
    //     updatedAt: { $first: "$updatedAt" },
    //     bookings: { $push: "$bookings" }
    //   }
    // },
    {
      $project: {
        _id: 1,
        title: 1,
        vendor: 1,
        activity_type:1,
        description:1, 
        location: 1,
        address: 1,
        startingDate:1, 
        endingDate: 1,
        budget: 1,
        media:1,
        clicksCount:1, 
        impressionCount:1,
        status: 1,
        createdAt:1, 
        updatedAt:1,
        bookings:1, 
      }
    },
    {
      $sort:{
        createdAt:-1
      }
    }
  ]
}

exports.filterServicesQuery = (matchConditions, rating) => {
  const query = [
    {
      $match: matchConditions
    },
    {
      $addFields: { recommended: true } // Add the isRecommended field using $set
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "users"
      }
    },
    {
      $unwind: "$users"
    },
    // {
    //   $match:{
    //     "user.isSubscribed": true
    //   }
    // },
    {
      $lookup: {
        from: "orgprofiles",
        localField: "users.profileId",
        foreignField: "_id",
        as: "users.profileId"
      }
    },
    {
      $unwind: "$users.profileId"
    },
    {
      $lookup: {
        from: "media",
        localField: "users.profileId.profileImage",
        foreignField: "_id",
        as: "users.profileId.profileImage"
      }
    },
    {
      $unwind: "$users.profileId.profileImage"
    },
    {
      $lookup: {
        from: "media",
        localField: "media",
        foreignField: "_id",
        as: "media"
      }
    },
    {
      $lookup: {
        from: "bookingreviews",
        localField: "_id",
        foreignField: "sourceId",
        as: "reviews"
      }
    },
    {
      $addFields: {
        avgRating: {
          $cond: {
            if: { $gt: [{ $size: "$reviews" }, 0] }, // If there are reviews
            then: { $avg: "$reviews.rating" }, // Calculate the average rating
            else: 0 // Set to 0 if there are no reviews
          }
        }
      }
    },
    {
      $unwind: {
        path: "$reviews",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: "$_id",
        title: { $first: "$title" },
        user: { $first: "$users" },
        activity_type: { $first: "$activity_type" },
        description: { $first: "$description" },
        location: { $first: "$location" },
        address: { $first: "$address" },
        startingDate: { $first: "$startingDate" },
        endingDate: { $first: "$endingDate" },
        budget: { $first: "$budget" },
        media: { $first: "$media" },
        clicksCount: { $first: "$clicksCount" },
        impressionCount: { $first: "$impressionCount" },
        status: { $first: "$status" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        // reviews: { $push: "$reviews" },
        averageRating : {$first: "$avgRating"}
      }
    },
    ...(rating && rating > 0 ? [{
      $match: {
        averageRating  : { $gte: rating }
      }
    }] : []),
    {
      $limit: 1
    }
  ];
  return query
};
// exports.getAllServices = (usersVibesPreferences) => {
//   return [
//     {
//       // Match services that have at least one matching vibe or preference
//       $match: {
//         $or: [
//           { vibes: { $in: usersVibesPreferences } },
//           { preferences: { $in: usersVibesPreferences } }
//         ],
//         status: SERVICE_STATUS.OPENED // Suggest only open services
//       }
//     },
//     {
//       // Optional: Add sorting logic, e.g., by clicksCount or impressionCount
//       $sort: { clicksCount: -1, impressionCount: -1 }
//     }
//   ]

// }

exports.getAllServices = (usersVibesPreferences) => {
  return [
    {
      $match: {
        $or: [
          { vibes: { $in: usersVibesPreferences } },
          { preferences: { $in: usersVibesPreferences } }
        ],
        // status: SERVICE_STATUS.OPENED
      }
    },
    {
      $addFields: { recommended: true }
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "users"
      }
    },
    {
      $unwind: "$users"
    },
    {
      $lookup: {
        from: "orgprofiles",
        localField: "users.profileId",
        foreignField: "_id",
        as: "users.profileId"
      }
    },
    {
      $unwind: "$users.profileId"
    },
    {
      $lookup: {
        from: "media",
        localField: "users.profileId.profileImage",
        foreignField: "_id",
        as: "users.profileId.profileImage"
      }
    },
    {
      $unwind: "$users.profileId.profileImage"
    },
    {
      $lookup: {
        from: "media",
        localField: "media",
        foreignField: "_id",
        as: "media"
      }
    },
    {
      $lookup: {
        from: "bookingreviews",
        localField: "_id",
        foreignField: "sourceId",
        as: "reviews"
      }
    },
    {
      $addFields: {
        avgRating: {
          $cond: {
            if: { $gt: [{ $size: "$reviews" }, 0] },
            then: { $avg: "$reviews.rating" },
            else: 0
          }
        }
      }
    },
    {
      $unwind: {
        path: "$reviews",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: "$_id",
        title: { $first: "$title" },
        user: { $first: "$users" },
        activity_type: { $first: "$activity_type" },
        description: { $first: "$description" },
        location: { $first: "$location" },
        address: { $first: "$address" },
        startingDate: { $first: "$startingDate" },
        endingDate: { $first: "$endingDate" },
        budget: { $first: "$budget" },
        media: { $first: "$media" },
        clicksCount: { $first: "$clicksCount" },
        impressionCount: { $first: "$impressionCount" },
        status: { $first: "$status" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        averageRating: { $first: "$avgRating" }
      }
    },
    {
      $sort: { clicksCount: -1, impressionCount: -1 }
    }
  ];
};