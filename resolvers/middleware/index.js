const { skip }= require('graphql-resolvers');

const Task = require('../../database/models/task');

module.exports.isAuthenticated = (_, __, { email }) => {
    if (!email) {
        throw new Error('Access invalid! please login to continue');
    }
    return skip;
};

module.exports.isTaskOwner = async (_, { id }, { loggedInUserId }) => {
    try {
        const task = await Task.findById(id);
        // console.log(typeof loggedInUserId);
        // console.log(typeof task.user.toString());
        if (!task) {
            throw new Error('Task not found');
        } else if ( task.user.toString() !== loggedInUserId ) {
            throw new Error('Not authorized as task owner');
        }
        // console.log(loggedInUserId === task.user.toString());
        return skip;   
    } catch (error) {
        console.log(error);
        throw error;
    }
};