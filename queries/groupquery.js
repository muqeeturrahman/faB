exports.groupusers = (matchConditions) =>[
  {
   $lookup: {
     from: "prefences",
     localField: "moodPrefernces",
     foreignField: "_id",
     as: "moodPrefernces"
   }
 },
 {
   $lookup: {
     from: "vibes",
     localField: "moodVibes",
     foreignField: "_id",
     as: "moodVibes"
   }
 },

 {
   $lookup: {
     from: "users",
     localField: "authId",
     foreignField: "_id",
     as: "authId"
   }
 },
 {
   $unwind: {
     path: "$authId",
     preserveNullAndEmptyArrays: true
   }
 },
 {
   $lookup: {
     from: "userprofiles",
     localField: "authId.profileId",
     foreignField: "_id",
     as: "authId.profileId"
   }
 },
 {
   $unwind: {
     path: "$authId.profileId",
     preserveNullAndEmptyArrays: true
   }
 },
 {
   $lookup: {
     from: "media",
     localField: "authId.profileId.profileImage",
     foreignField: "_id",
     as: "authId.profileId.profileImage"
   }
 },
 {
   $unwind: {
     path: "$authId.profileId.profileImage",
     preserveNullAndEmptyArrays: true
   }
 },
 {
    $match:matchConditions,
 },
 {
   $project: {
     __v:0
   }
 }
]
