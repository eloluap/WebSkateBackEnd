var logger = require('../../config/winston');

const openai = require('openai');
var config = require("config");
const apiKey = config.get('openai.apiKey');
const ai = new openai({ apiKey: apiKey });

function parseInput(userInput, callback) {
    if (userInput) {
        ai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ "role": "system", "content": "You are a helpful assistant converting user input into structured API calls." },
            { "role": "user", "content": `Parse the following user input into a structured API Call: "${userInput}"` }],
            max_tokens: 100
        }).then(gptResponse => {
            const parsedData = gptResponse.choices[0].message.content;
            logger.info("Parsed data: " + parsedData);
            callback(null, parsedData);
        }).catch(error => {
            logger.error("Error parsing userinput in GPT: " + error);
            callback("Error parsing userinput in GPT", null);
        })
    } else {
        logger.error("Got no userinput");
        callback("Got no userinput", null);
    }
}

module.exports = {
    parseInput
}