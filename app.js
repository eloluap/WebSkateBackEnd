var express = require('express');
var path = require('path');
var logger = require('./config/winston');
var morgan = require('morgan');
var cors = require('cors');

const database = require('./database/db');

var indexRouter = require('./endpoints/index/IndexRoute');
var userRouter = require('./endpoints/user/UserRoute');
var authenticationRouter = require('./endpoints/authentication/AuthenticationRoute');
var forumPostRouter = require('./endpoints/forumPost/ForumPostRoute');
var commentRouter = require('./endpoints/comment/CommentRoute');
var skateparkRouter = require('./endpoints/skatepark/SkateparkRoute');
var recensionRouter = require('./endpoints/recension/RecensionRoute');
var chatRouter = require('./endpoints/chat/ChatRoute');
var messageRouter = require('./endpoints/message/MessageRoute');
var registrationRouter = require('./endpoints/registration/RegistrationRoute');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use("*", cors());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Expose-Headers", "Authorization");
    next();
});
app.use(cors({ exposedHeaders: ['Authorization'] }));
app.use(express.json()); //parses json body 
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('combined', { "stream": logger.stream }));

// Adding Routes
app.use('/', indexRouter);
app.use('/users', userRouter);
app.use('/authenticate', authenticationRouter);
app.use('/forum', forumPostRouter);
app.use('/comment', commentRouter);
app.use('/skatepark', skateparkRouter);
app.use('/recension', recensionRouter);
app.use('/chat', chatRouter);
app.use('/message', messageRouter);
app.use('/registration', registrationRouter);

// Connect to Database
database.initDB(function (err, db) {
    if (db) {
        logger.info("Sucessfully connected to Database.")
    } else {
        logger.error("Did not sucessfully connect to Database.")
    }
});

module.exports = app;