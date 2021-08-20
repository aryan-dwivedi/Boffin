import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import mikroOrmConfig from "./mikro-orm.config";
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql'
import { HelloResolvers } from "./resolvers/hello";
import { PostResolvers } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);
    await orm.getMigrator().up();

    const app = express();

    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient()
    app.use(
        cors({
        origin: 'http://localhost:3000',
        credentials: true,
    })
    )

    app.use(
        session({
            name: 'qid',
            store: new RedisStore({
                client: redisClient,
                // ttl: __prod__ ? 1000 * 60 * 60 * 24 * 365 : 1000 * 60 * 60 * 24 * 7, // 1 year : 1 week
                disableTouch: true
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
                httpOnly: true,
                sameSite: 'lax', //csrf
                secure: __prod__,
            },
            saveUninitialized: false,
            secret: 'idonthaveasecret',
            resave: false,
        })
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolvers, PostResolvers, UserResolver],
            validate: false
        }),
        context: ({ req, res }) => ({ em: orm.em, req, res }),
    });

    await apolloServer.start();

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log("Server started on localhost:4000");
    })
};

main();