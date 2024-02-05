var logger = require('../../config/winston');

const openai = require('openai');
var config = require("config");
const apiKey = config.get('openai.apiKey');
const ai = new openai({ apiKey: apiKey });

var forumPostService = require('../forumPost/ForumPostService');
var commentService = require('../comment/CommentService');

function parseInputForumPage(userInput, callback) {
    logger.info("AIService: Parsing user Input on the Forum Page");
    forumPostService.getForumPosts(function (err, forumPosts) {
        if (err) {
            logger.error("Error getting ForumPosts: " + err);
            callback(err, null);
        }
        // TODO: Tune Prompt with forumPosts Data for Forum Page
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
    parseInputPostPage
}