var logger = require('../../config/winston');

const openai = require('openai');
var config = require("config");
const apiKey = config.get('openai.apiKey');
const ai = new openai({ apiKey: apiKey });

var forumPostService = require('../forumPost/ForumPostService');
var commentService = require('../comment/CommentService');

// returns {method: "GET | POST", data: {title: "", text: "", postID: ""}} to callback function
function parseInputForumPage(userInput, callback) {
    logger.info("AIService: Parsing user Input on the Forum Page");
    forumPostService.getForumPosts(function (err, forumPosts) {
        if (err) {
            logger.error("Error getting ForumPosts: " + err);
            callback(err, null);
        } else {
            const forumPostsString = forumPosts.map(obj => (JSON.stringify(obj))).join(", ");
            logger.debug("Additional current posts info for AI: " + forumPostsString);
            ai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                response_format: { type: "json_object" },
                temperature: 0.2,
                messages: [{ "role": "system", "content": 'You are an expert at extracting information from user input and will use this skill to convert user input into this specific JSON format delimited by triple quotes: """{"method": "GET | POST", "data": {title: "", text: "", postID: ""}}""" Never differ from this format because the JSON data will be used to do API calls. Depending on if you think someone wants to open or create something you will use GET or POST respectively as the value for method. Only fill in the fields you need and leave the rest empty.' },
                { "role": "system", "content": `For GET requests use this list of the current forumposts delimited by triple quotes to find out the corresponding postID: """${forumPostsString}"""` },
                { "role": "user", "content": `Parse the following user input delimited by triple quotes into the specified JSON format: """Öffne den Post mit dem Titel 'Skaten in Tempelhof'"""` },
                { "role": "assistant", "content": '{"method": "GET", "data": {"title": "", "text": "", "postID": "0"}}' },
                { "role": "user", "content": `Parse the following user input delimited by triple quotes into the specified JSON format: """Erstelle einen Post mit dem Titel 'Mein erster Post' und dem Text 'Moin Leute, für was ist dieses Forum gedacht?'"""` },
                { "role": "assistant", "content": '{"method": "POST", "data": {"title": "Mein erster Post", "text": "Moin Leute, für was ist dieses Forum gedacht?", "postID": ""}}' },
                { "role": "user", "content": `Parse the following user input delimited by triple quotes into the specified JSON format: """${userInput}"""` }]
            }).then(gptResponse => {
                const parsedDataString = gptResponse.choices[0].message.content;
                logger.debug("Successfully parsed user input: " + parsedDataString);
                const parsedDataJson = JSON.parse(parsedDataString);
                callback(null, parsedDataJson);
            }).catch(error => {
                callback(error, null);
            })
        }
    });
}

function getPostPage(postID, callback) {
    if (isNaN(postID)) {
        callback("The postID is not a number", null);
    } else {
        const returnObj = { call: "GET_post", body: { postID: postID } }
        callback(null, returnObj);
    }
}

function createPost(title, text, callback) {
    if (title.length === 0 || text.length === 0) {
        callback("The title or text is empty", null);
    } else {
        const returnObj = { call: "POST_post", body: { title: title, text: text } }
        callback(null, returnObj);
    }
}

// returns {method: "POST | PUT | DELETE", entity: "post | comment", data: {title: "", text: "", commentID: ""}} to callback function
function parseInputPostPage(userInput, postID, callback) {
    logger.info("AIService: Parsing user Input on a Post Page");
    forumPostService.findPostBy(postID, function (err, post) {
        if (err) {
            logger.error("There is no forumPost with this postID");
            callback(err, null);
        } else {
            commentService.getCommentsFromPost(postID, function (err2, comments) {
                if (err2) {
                    logger.error("There is no forumPost with this postID");
                    callback(err2, null);
                } else {
                    const forumPostString = JSON.stringify(post);
                    logger.debug("Additional current post info for AI: " + forumPostString);
                    const commentsString = comments.map(obj => (JSON.stringify(obj))).join(", ");
                    logger.debug("Additional current comments on post info for AI: " + commentsString);
                    ai.chat.completions.create({
                        model: 'gpt-3.5-turbo',
                        response_format: { type: "json_object" },
                        temperature: 0.2,
                        messages: [{ "role": "system", "content": 'You are an expert at extracting information from user input and will use this skill to convert user input into this specific JSON format delimited by triple quotes: """{"method": "POST | PUT | DELETE", "entity": "post | comment", "data": {title: "", text: "", commentID: ""}}""" Never differ from this format because the JSON data will be used to do API calls. In the format for the key "entity" you should put either "post" or "comment" as the value depending on if you think the user input is about a forumpost or a comment. Depending on if you think someone wants to create, update or delete something you will use POST, PUT or DELETE respectively as the value for method. Creating a new forumpost is not possible, so your answer can not include POST as the method if the entity is post, use PUT instead. Only fill in the fields you need and leave the rest empty.' },
                        { "role": "system", "content": `For PUT and DELETE requests for the entity comment use this list of the current comments on this post delimited by triple quotes to find out the corresponding commentID: """${commentsString}"""` },
                        { "role": "user", "content": `Parse the following user input delimited by triple quotes into the specified JSON format: """Update den Post bitte zu dem neuen Titel 'Mittlerweile habe ich Erfahrung' und dem Text 'Achso, dafür ist das Forum gedacht!'"""` },
                        { "role": "assistant", "content": '{"method": "PUT", "entity": "post", "data": {"title": "Mittlerweile habe ich Erfahrung", "text": "Achso, dafür ist das Forum gedacht!", "commentID": "0"}}' },
                        { "role": "user", "content": `Parse the following user input delimited by triple quotes into the specified JSON format: """Lösche den Post"""` },
                        { "role": "assistant", "content": '{"method": "DELETE", "entity": "post"}, "data": {"title": "", "text": "", "commentID": ""}}' },
                        { "role": "user", "content": `Parse the following user input delimited by triple quotes into the specified JSON format: """Erstelle einen Kommentar mit dem Text 'Ich persönlich finde den Skatepark eigentlich recht gut!'"""` },
                        { "role": "assistant", "content": '{"method": "POST", "entity": "comment", "data": {"title": "", "text": "Ich persönlich finde den Skatepark eigentlich recht gut!", "commentID": ""}}' },
                        { "role": "user", "content": `Parse the following user input delimited by triple quotes into the specified JSON format: """Update den Kommentar 'Ich persönlich finde...' zu 'Jetzt wo ich nochmal nachgedacht habe, bin ich mir doch nicht mehr so sicher.'"""` },
                        { "role": "assistant", "content": '{"method": "PUT", "entity": "comment", "data": {"title": "", "text": "Jetzt wo ich nochmal nachgedacht habe, bin ich mir doch nicht mehr so sicher.", "commentID": "0"}}' },
                        { "role": "user", "content": `Parse the following user input delimited by triple quotes into the specified JSON format: """Lösche den Kommentar mit dem Text 'Ich persönlich finde den Skatepark eigentlich recht gut!'"""` },
                        { "role": "assistant", "content": '{"method": "DELETE", "entity": "comment", "data": {"title": "", "text": "", "commentID": "0"}}' },
                        { "role": "user", "content": `Parse the following user input delimited by triple quotes into the specified JSON format: """${userInput}"""` }]
                    }).then(gptResponse => {
                        const parsedDataString = gptResponse.choices[0].message.content;
                        logger.debug("Successfully parsed user input: " + parsedDataString);
                        const parsedDataJson = JSON.parse(parsedDataString);
                        callback(null, parsedDataJson);
                    }).catch(error => {
                        callback(error, null);
                    });
                }
            });
        }
    });
}

function updatePost(postID, title, text, callback) {
    if ((title === undefined || title.length === 0) && (text === undefined || text.length === 0)) {
        callback("The title and the text is empty", null);
    } else if (!(title === undefined || title.length === 0) && !(text === undefined || text.length === 0)) {
        const returnObj = { call: "PUT_post", body: { title: title, text: text } }
        callback(null, returnObj);
    } else {
        forumPostService.findPostBy(postID, function (err, post) {
            if (err) {
                logger.error("There is no forumPost with this postID");
                callback(err, null);
            } else {
                if (title.length > 0) {
                    const oldPostText = post.content;
                    const returnObj = { call: "PUT_post", body: { title: title, text: oldPostText } }
                    callback(null, returnObj);
                } else {
                    const oldPostTitle = post.titel;
                    const returnObj = { call: "PUT_post", body: { title: oldPostTitle, text: text } }
                    callback(null, returnObj);
                }
            }
        });
    }
}

function deletePost(callback) {
    const returnObj = { call: "DELETE_post" }
    callback(null, returnObj);
}

function createComment(text, callback) {
    if (text.length === 0) {
        callback("The text is empty", null);
    } else {
        const returnObj = { call: "POST_comment", body: { text: text } }
        callback(null, returnObj);
    }
}

function updateComment(commentID, text, callback) {
    if (isNaN(commentID)) {
        callback("The commentID is not a number", null);
    } else if (text.length === 0) {
        callback("The text is empty", null);
    } else {
        const returnObj = { call: "PUT_comment", body: { text: text, commentID: commentID } }
        callback(null, returnObj);
    }
}

function deleteComment(commentID, callback) {
    if (isNaN(commentID)) {
        callback("The commentID is not a number", null);
    } else {
        const returnObj = { call: "DELETE_comment", body: { commentID: commentID } }
        callback(null, returnObj);
    }
}

module.exports = {
    parseInputForumPage,
    getPostPage,
    createPost,
    parseInputPostPage,
    updatePost,
    deletePost,
    createComment,
    updateComment,
    deleteComment
}