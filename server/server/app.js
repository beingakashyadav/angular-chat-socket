import http from "http";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import {errorHandler as queryErrorHandler} from 'querymen'
import {errorHandler as bodyErrorHandler} from 'bodymen'
import { Server } from 'socket.io'

// mongo connection
import "./mongo";

// socket configuration
import WebSockets from "./utils/WebSockets.js";
// routes
// we switch to graphql, so we not use legacy route any more
// import indexRouter from "./routes/index.js";
// import userRouter from "./routes/user.js";
// import chatRoomRouter from "./routes/chatRoom.js";
// import deleteRouter from "./routes/delete.js";

// middlewares
import authGraphql from "./middlewares/auth-graphql";

// config
import {env, ip, port} from './config'

//express-graphql
import {graphqlHTTP} from "express-graphql";
import {useServer} from "graphql-ws/lib/use/ws";
import schema from './graphql'

//facebook
import {facebook} from "./service/passport";
import {facebook_redirect} from "./service/passport";

const { execute, subscribe } = require('graphql')
const ws = require('ws')

const app = express();



/** Get port from environment and store in Express. */
app.set("port", port);

app.use(cors())
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(queryErrorHandler())
app.use(bodyErrorHandler())


//facebook auth
app.get('/auth/facebook', facebook())
app.get('/auth/facebook/callback', facebook_redirect())

//graphql
app.use('/graphql', authGraphql , graphqlHTTP(req => ({
  schema: schema,
  graphiql: true,
  context: {
    isAuthenticated: req.isAuthenticated,
    user: req.user,
    error: req.error,
    masterKey: req.masterKey
  },
  customFormatErrorFn: (err) => {
    if (!err.originalError) {
      return err
    }
    /*
        You can add the following to any resolver
        const error = new Error('My message')
        error.data = [...]
        error.code = 001
    */
    const message = err.message || 'An error occured.'
    const code = err.originalError.code
    const data = err.originalError.data
    return {
      // ...err,
      message,
      code,
      data
    }
  }

})))

// app.use("/", indexRouter);
// app.use("/users", userRouter);
// app.use("/room", decode, chatRoomRouter);
// app.use("/delete", deleteRouter);

/** Create HTTP server. */
// function createHttpServer(app){
//   if (env === 'production') {
//     const sslkey = fs.readFileSync('./www/keys/ssl-key.pem')
//     const sslcert = fs.readFileSync('./www/keys/ssl-cert.pem')
//     const option = {
//       key: sslkey,
//       cert: sslcert
//     }
//     return {server: https.createServer(option, app), urlPrefix: 'https://'}
//   } else {
//     return {server: http.createServer(app), urlPrefix: 'http://'}
//   }
//
// }

const server = http.createServer(app)

/** Create socket connection */
global.io = new Server(server, {
  cors: {
    origin: '*',
    method: ['GET', 'POST']
  }
})
global.io.on('connection', WebSockets.connection)


server.listen({ip: ip, port: port}, () => {
  const path = '/subscriptions'
  const wsServer = new ws.Server({
    server,
    path
  });

  useServer(
    {
      schema,
      execute,
      subscribe,
      onConnect: (ctx) => {
        console.log('Connect');
      },
      onSubscribe: (ctx, msg) => {
        console.log('Subscribe');
      },
      onNext: (ctx, msg, args, result) => {
        console.debug('Next');
      },
      onError: (ctx, msg, errors) => {
        console.error('Error');
      },
      onComplete: (ctx, msg) => {
        console.log('Complete');
      },
    },
    wsServer
  );
  console.log(`Listening on server: http://${ip}:${port}`)
  console.log(`GraphQL endpoint: http://${ip}:${port}/graphql`)
  console.log(`GraphQL subscription: http://${ip}:${port}/subscriptions`)
})
