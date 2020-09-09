const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const cors = require('cors');
const dotEnv = require('dotenv');
const Dataloader = require('dataloader');

const { connection } = require('./database/util');
const { verifyUser } = require('./context/helper');
//For apoolo server
const resolvers = require('./resolvers');
const typeDefs = require('./typeDefs');
const loaders = require('./loaders');

//set dot env variables
dotEnv.config();

const app = express();

//set database connection
connection();

//cors enable
app.use(cors());

//bodyparser middleware
app.use(express.json());

//set apollo server
const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({req, connection}) => {
        const contextObj = {};
        if (req) {
            await verifyUser(req);
            contextObj.email = req.email;
            contextObj.loggedInUserId = req.loggedInUserId;
        };
        contextObj.loaders = {
            user: new Dataloader(keys => loaders.user.batchUsers(keys))
        };
        return contextObj;
    },
    formatError: (error) => {
        return {
            message: error.message
        }
    }
});

apolloServer.applyMiddleware({app, path:'/graphql'});

const PORT = process.env.PORT || 3000;

app.use('/', (req, res, next) => {
    res.send({message: 'Hello KMery'});
});

const httpServer = app.listen(PORT, () => {
    console.log(`Server listen on port: ${PORT}`);
    console.log(`GraphQL endpoint: ${apolloServer.graphqlPath}`);
});

apolloServer.installSubscriptionHandlers(httpServer);