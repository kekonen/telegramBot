const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;

var token = fs.readFileSync('telegramService.key', 'utf8').trim();
var serviceChatIds = [218135295];
var bot = new TelegramBot(token, {polling: true});

bot.onText(/\/gitpull/, (msg, match) => {
    console.log(msg);
    if (serviceChatIds.indexOf(msg.from.id) >= 0) {
        var dir = exec("git pull", function(err, stdout, stderr) {
            if (err) {
              // should have err.code here?  
            }
            console.log(stdout);
          });
    }
})