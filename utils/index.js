const { STATUS_CODE } = require("./constants");

exports.generateResponse = (data, message, res) => {
    return res.status(STATUS_CODE.OK).send({
        status: true,
        data,
        message,
    });
}


exports.generateRandomOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
}


exports.parseBody = (body) => {
    let obj;
    if (typeof body === "object") obj = body;
    else obj = JSON.parse(body);
    return obj;
}
exports.getMongoosePaginatedData = async ({
    model, page = 1, limit = 10, query = {}, populate = '', select = '-password', sort = { createdAt: 1 },
}) => {
    const options = {
        select,
        sort,
        populate,
        lean: true,
        page,
        limit,
        customLabels: {
            totalDocs: 'totalItems',
            docs: 'data',
            page: 'currentPage',
            meta: 'pagination',
        },
    };

    const { data, pagination } = await model.paginate(query, options);
    // // Remove __v key from each document in the data array
    // data.forEach(doc => {
    //     delete doc.__v;
    //     delete doc.id;
    //     return doc;
    // });

    delete pagination.limit;
    delete pagination.pagingCounter;

    return { data, pagination };
}
exports.getMongooseAggregatePaginatedData = async ({
    model, page = 1, limit = 10, query = [], populate = '', select = '-password', sort = { createdAt: -1 },
}) => {
    const options = {
        select,
        sort,
        lean: true,
        page,
        populate: 'sender',
        limit,
        customLabels: {
            totalDocs: 'totalItems',
            docs: 'data',
            page: 'currentPage',
            meta: 'pagination',
        },
    };



    const myAggregate = model.aggregate(query);
    const { data, pagination } = await model.aggregatePaginate(myAggregate, options);
    // // Remove __v key from each document in the data array
    // data.forEach(doc => {
    //     delete doc.__v;
    //     delete doc.id;
    //     return doc;
    // });

    delete pagination.limit;
    delete pagination.pagingCounter;

    return { data, pagination };
}
