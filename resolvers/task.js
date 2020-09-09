// const uuid = require('uuid');
const { combineResolvers } = require('graphql-resolvers');

// const { users, tasks } = require('../constants/index');
const Task = require('../database/models/task');
const User = require('../database/models/user');
const { isAuthenticated, isTaskOwner } = require('./middleware');
const { query } = require('express');
const { stringToBase64, base64ToString } = require('../context');

module.exports = {
    Query: {
        tasks: combineResolvers(isAuthenticated, async (_, { cursor, limit = 10 }, { loggedInUserId }) => {
          // tasks
          try {
            const query = {user: loggedInUserId};
            if (cursor) {
              query['_id'] = {
                '$lt': base64ToString(cursor)
              }
            }
            let tasks = await Task.find(query).sort({_id: -1}).limit(limit + 1);
            const hasNextPage = tasks.length > limit;
            tasks = hasNextPage ? tasks.slice(0, -1) : tasks; 
            return {
              taskFeed: tasks,
              pageInfo: {
                nextPageCursor: hasNextPage ? stringToBase64(tasks[tasks.length - 1].id) : null,
                hasNextPage
              }
            };
          } catch (error) {
            console.log(error);
            throw error;
          }
        }),
        task: combineResolvers(isAuthenticated, isTaskOwner, async (_, { id }) => {
          // tasks.find(task => task.id === id)
          try {
            const task = await Task.findById(id);
            return task; 
          } catch (error) {
            console.log(error);
            throw error;
          }
        })
    },
    Mutation: {
      createTask: combineResolvers(isAuthenticated, async (_, { input }, { email }) => {
        // const task = {...input, id: uuid.v4()};
        // tasks.push(task);
        // return task;
        try {
          const user = await User.findOne({ email });
          const task =  new Task({...input, user: user.id});
          const result = await task.save();
          user.tasks.push(result.id);
          await user.save();
          return result; 
        } catch (error) {
          console.log(error);
          throw error;
        }
      }),
      updateTask: combineResolvers(isAuthenticated, isTaskOwner, async (_, { id, input }) => {
        try {
          const task = await Task.findByIdAndUpdate(id, { ...input }, { new: true });
          return task 
        } catch (error) {
          console.log(error);
          throw error;
        }
      }),
      deleteTask: combineResolvers(isAuthenticated, isTaskOwner, async (_, { id }, { loggedInUserId }) => {
        try {
          const task = await Task.findByIdAndDelete(id);
          await User.updateOne({ _id: loggedInUserId }, { $pull: {tasks: task.id} });
          return task;
        } catch (error) {
          console.log(error);
          throw error;
        }
      })
    },
    Task: {
      user: async (parent, _, { loaders }) => {
        // users.find(user => user.id === userId)
        try {
          // const user = await User.findById({ id: userId })
          const user = await loaders.user.load(parent.user.toString());
          return user;
        } catch (error) {
          console.log(error);
          throw error
        }
      }
    }
}


// User: {
//   tasks: async ({ id }) => {
//     // tasks.filter(task => task.userId === id)
//     try {
//       const tasks = await Task.find({user: id});
//       return tasks;
//     } catch (error) {
//       console.log(error);
//       throw error;
//     }
//   }