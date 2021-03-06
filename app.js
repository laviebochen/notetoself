const botbuilder = require('botbuilder');
const restify = require('restify');
require('dotenv').config();
const DBHandler = require('./middleware/DbHandler');
const RootDialog = require('./dialogs/RootDialog');

// Create server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`${server.name} listening to ${server.url}`);
});

// Create adapter (it's ok for MICROSOFT_APP_ID and MICROSOFT_APP_PASSWORD to be blank for now)
const adapter = new botbuilder.BotFrameworkAdapter({ 
    appId: process.env.MICROSOFT_APP_ID, 
    appPassword: process.env.MICROSOFT_APP_PASSWORD 
});

// Add conversation state middleware
const conversationState = new botbuilder.ConversationState(new botbuilder.MemoryStorage()); 
adapter.use(conversationState);

const dbHandler = new DBHandler(conversationState);
adapter.use(dbHandler);

const rootDialog = new RootDialog(conversationState, null, 'root');

// Listen for incoming requests 
server.post('/api/messages', (req, res) => {
    // Route received request to adapter for processing
    adapter.processActivity(req, res, async (context) => {
        if (context.activity.type === 'message') {
            await rootDialog.onTurn(context);
        } else if (context.activity.type === 'conversationUpdate') {
            if (context.activity.membersAdded &&
                context.activity.membersAdded[0].id.includes(process.env.MICROSOFT_APP_ID)) {
                await context.sendActivity("Hello! I'm notetoself, the bot that will store and organize stuff you send to yourself!");
            }
        } else {
            await context.sendActivity("I don't understand what you're saying!");
        }
    });
});