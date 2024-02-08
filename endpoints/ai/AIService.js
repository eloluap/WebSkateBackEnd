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
            // TODO: Fine Tune Prompt for cases where not enough input is given
            ai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ "role": "system", "content": 'You are a helpful assistant converting user input into one of two json formats, which will follow later. The json data will then be used to do API calls. So never differ from the formats. Depending on if you think someone wants to open something or create something you will use one of these formats: {"method": "GET", "data": {"postID": "put the corresponding postID here"} or {"method": "POST", "data": {"title": "put the extracted or matching title here", "text": "put the text of the forumpost here"}}' },
                { "role": "system", "content": `For GET requests you can use this list of the current Forum Posts to find out the postID: "${forumPostsString}"` },
                { "role": "user", "content": `Parse the following user input into a matching json format to be used for an API Call: "Erstelle einen Post mit dem Titel "Mein erster Post" und dem Text "Moin Leute, für was ist dieses Forum gedacht?""` },
                { "role": "assistant", "content": '{"method": "POST", "data": {"title": "Mein erster Post", "text": "Moin Leute, für was ist dieses Forum gedacht?"}}' },
                { "role": "user", "content": `Parse the following user input into a matching json format to be used for an API Call (There is no post with this title, thats why the postID is assumed to be 0): "Öffne den Post mit dem Titel "Skaten in Tempelhof""` },
                { "role": "assistant", "content": '{"method": "GET", "data": {"postID": "0"}}' },
                { "role": "user", "content": `Parse the following user input into a matching json format to be used for an API Call: "${userInput}"` }]
                // max_tokens: 500
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

// returns {method: "POST | PUT | DELETE", data: {title: "", text: "", commentID: ""}} to callback function
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
                    // TODO: Maybe sanitize data before giving it to AI - maybe give username to AI to help with checking for "my" comment
                    const forumPostString = JSON.stringify(post);
                    logger.debug("Additional current post info for AI: " + forumPostString);
                    const commentsString = comments.map(obj => (JSON.stringify(obj))).join(", ");
                    logger.debug("Additional current comments on post info for AI: " + commentsString);
                    // TODO: Tune Prompt with post and comments Data for Post Page
                    ai.chat.completions.create({
                        model: 'gpt-3.5-turbo',
                        messages: [{ "role": "system", "content": 'You are a helpful assistant converting user input into one of three json formats, which will follow later. The json data will then be used to do API calls. So never differ from the formats. In the format there will be a key value pair where the key is entity and you should put either "post" or "comment" as the value depending on if you think the user input is about a forumpost or a comment. Its not possible to create a new forumpost. Depending on if you think someone wants to create, update or delete something you will use one of these formats: {"method": "POST", "entity": "comment", "data": {"text": "put the text of the comment here"}}, {"method": "PUT", "entity": "put comment or post here" "data": {"title": "put the new extracted or matching title here, leave empty for a comment entity", "text": "put the new text of the forumpost or comment here", "commentID": "for comments put the extracted commentID here, leave empty for a post entity"}}, {"method": "DELETE", "entity": "put comment or post here", "data": {"commentID": "for comments put the extracted commentID here, leave empty for a post entity"}}' },
                        { "role": "system", "content": `For PUT and DELETE requests for the entity comment you can use this list of the current comments on this post to find out the commentID: "${commentsString}"` },
                        { "role": "user", "content": `Parse the following user input into a matching json format to be used for an API Call: "Update den Post bitte zu dem neuen Titel "Mittlerweile habe ich Erfahrung" und dem Text "Achso, dafür ist das Forum gedacht!""` },
                        { "role": "assistant", "content": '{"method": "PUT", "entity": "post", "data": {"title": "Mittlerweile habe ich Erfahrung", "text": "Achso, dafür ist das Forum gedacht!"}}' },
                        { "role": "user", "content": `Parse the following user input into a matching json format to be used for an API Call: "Lösche den Post"` },
                        { "role": "assistant", "content": '{"method": "DELETE", "entity": "post"}' },
                        { "role": "user", "content": `Parse the following user input into a matching json format to be used for an API Call: "Erstelle einen Kommentar mit dem Text "Ich persönlich finde den Skatepark eigentlich recht gut!""` },
                        { "role": "assistant", "content": '{"method": "POST", "entity": "comment", "data": {"text": "Ich persönlich finde den Skatepark eigentlich recht gut!"}}' },
                        { "role": "user", "content": `Parse the following user input into a matching json format to be used for an API Call (There is no comment with this text in the data, thats why the commentID is assumed to be 0): "Update den Kommentar "Ich persönlich finde..." zu "Jetzt wo ich nochmal nachgedacht habe, bin ich mir doch nicht mehr so sicher.""` },
                        { "role": "assistant", "content": '{"method": "PUT", "entity": "comment", "data": {"text": "Jetzt wo ich nochmal nachgedacht habe, bin ich mir doch nicht mehr so sicher.", "commentID": "0"}}' },
                        { "role": "user", "content": `Parse the following user input into a matching json format to be used for an API Call (There is no comment with this text in the data, thats why the commentID is assumed to be 0): "Lösche den Kommentar mit dem Text "Jetzt wo ich nochmal nachgedacht habe, bin ich mir doch nicht mehr so sicher.""` },
                        { "role": "assistant", "content": '{"method": "DELETE", "entity": "comment", "data": {"commentID": "0"}}' },
                        { "role": "user", "content": `Parse the following user input into a matching json format to be used for an API Call: "${userInput}"` }]
                        // max_tokens: 500
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