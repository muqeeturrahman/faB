// getuserquery.js
const {populateOptions}=require('../utils/helper.js');
exports.getUserQuery = (role) =>[
    {
        '$match': {
            'role': role
        }
    }, {
        '$lookup': {
            'from':populateOptions(role)['populate']['model'], 
            'localField': 'profileId', 
            'foreignField': '_id', 
            'as': 'profileId'
        }
    }, {
        '$unwind': {
            'path': '$profileId'
        }
    }, {
        '$lookup': {
            'from': 'media', 
            'localField': 'profileId.profileImage', 
            'foreignField': '_id', 
            'as': 'profileId.profileImage'
        }
    }, {
        '$unwind': {
            'path': '$profileId.profileImage'
        }
    }
]


