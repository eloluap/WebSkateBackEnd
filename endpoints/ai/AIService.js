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
        }
        const forumPostsString = forumPosts.map(obj => (JSON.stringify(obj))).join(", ");
        logger.debug("Additional current posts info for AI: " + forumPostsString);
        // TODO: Fine Tune Prompt for cases where not enough input is given
        ai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ "role": "system", "content": 'You are a helpful assistant converting user input into one of two json formats, which will follow later. The json data will then be used to do API calls. So dont differ from the formats. Depending on if you think someone wants to open something or create something you will use one of these formats: {"method": "GET", "data": {"postID": "put the corresponding postID here"} or {"method": "POST", "data": {"title": "put the extracted or matching title here", "text": "put the text of the forumpost here"}}' },
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
            logger.error("Error parsing userinput in GPT: " + error);
            callback("Error parsing userinput in GPT", null);
        })
    });
}

function getPostPage(postID, callback) {
    // TODO: Implement the transformation of data to the corresponding body for api call in frontend
    const returnObj = { postID: postID }
    callback(null, returnObj);
}

function createPost(title, text, callback) {
    // TODO: Implement the transformation of data to the corresponding body for api call in frontend
    const returnObj = { title: title, text: text }
    callback(null, returnObj);
}

function parseInputPostPage(userInput, postID, callback) {
    logger.info("AIService: Parsing user Input on a Post Page");
    forumPostService.findPostBy(postID, function (err, post) {
        if (err) {
            logger.error("There is no forumPost with this postID");
            callback(err, null);
        }
        commentService.getCommentsFromPost(postID, function (err2, comments) {
            if (err2) {
                logger.error("There is no forumPost with this postID");
                callback(err2, null);
            }
            // TODO: Tune Prompt with post and comments Data for Post Page
            ai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ "role": "system", "content": 'You are a helpful assistant converting user input into structured API calls using only this format (choosing between word if they are seperated by this character |): {method: "GET | POST | PUT | DELETE", data: {input the extracted user input here with key value pairs}}' },
                { "role": "user", "content": `Parse the following user input into a structured API Call: "Erstelle einen Post mit dem Titel "Mein erster Post" und dem Text "Moin Leute, für was ist dieses Forum gedacht?""` },
                { "role": "assistant", "content": "{method: 'POST', data: {title: 'Mein erster Post', text: 'Moin Leute, für was ist dieses Forum gedacht?'}}" },
                { "role": "user", "content": `Parse the following user input into a structured API Call: "${userInput}"` }],
                max_tokens: 500
            }).then(gptResponse => {
                const parsedData = gptResponse.choices[0].message.content;
                logger.info("Parsed data: " + parsedData);
                callback(null, parsedData);
            }).catch(error => {
                logger.error("Error parsing userinput in GPT: " + error);
                callback("Error parsing userinput in GPT", null);
            })
        });
    });
}

module.exports = {
    parseInputForumPage,
    getPostPage,
    createPost,
    parseInputPostPage
}