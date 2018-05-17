const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;

var token = fs.readFileSync('telegramService.key', 'utf8').trim();
var serviceChatIds = [218135295];
var bot = new TelegramBot(token, {polling: true});

bot.sendMessage(serviceChatIds[0],'BotStarted');


bot.onText(/\/gitpull/, (msg, match) => {
    console.log(msg);
    if (serviceChatIds.indexOf(msg.from.id) >= 0) {
        var dir = exec("git pull", function(err, stdout, stderr) {
            if (err) {
                bot.sendMessage(msg.from.id, 'Error:\n```\n' + err + '```', {parse_mode:'Markdown'}) 
                bot.sendMessage(msg.from.id, 'Stdout:\n```\n' + stdout + '```', {parse_mode:'Markdown'}) 
            }
            bot.sendMessage(msg.from.id, '```\n' + stdout + '```', {parse_mode:'Markdown'})
            console.log(stdout);
          });
    }
})

bot.onText(/\/changeBranch (.+)/, (msg, match) => {
    console.log(msg);
    if (serviceChatIds.indexOf(msg.from.id) >= 0) {
        var dir = exec(`git checkout ${match[1]}`, function(err, stdout, stderr) {
            if (err) {
                bot.sendMessage(msg.from.id, 'Error:\n```\n' + err + '```', {parse_mode:'Markdown'}) 
                bot.sendMessage(msg.from.id, 'Stdout:\n```\n' + stdout + '```', {parse_mode:'Markdown'}) 
            }
            bot.sendMessage(msg.from.id, '```\n' + stdout + '```', {parse_mode:'Markdown'})
            console.log(stdout);
          });
    }
})

bot.onText(/\/deleteHistory (.+)/, (msg, match) => {
    console.log(msg);
    if (serviceChatIds.indexOf(msg.from.id) >= 0) {
        var dir = exec(`rm voices.db && rm users.db && rm audios/C* && rm audios/21* && forever restart main`, function(err, stdout, stderr) {
            if (err) {
                bot.sendMessage(msg.from.id, 'Error:\n```\n' + err + '```', {parse_mode:'Markdown'}) 
                bot.sendMessage(msg.from.id, 'Stdout:\n```\n' + stdout + '```', {parse_mode:'Markdown'}) 
            }
            bot.sendMessage(msg.from.id, 'Done:\n```\n' + stdout + '```', {parse_mode:'Markdown'})
            console.log(stdout);
          });
    }
})