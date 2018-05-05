const TelegramBot = require('node-telegram-bot-api');
var fs = require('fs');

// replace the value below with the Telegram token you receive from @BotFather
// fs.readFile('DATA', 'utf8', function(err, contents) {
//     const token = contents;
// });
const token = fs.readFileSync('telegram.key', 'utf8').trim();
console.log('Token: ', token)

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});


// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

bot.onText(/\/напомни (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const what = match[1];

  const napomnyV = (result, chatId, bot) => {
    const day = result[2];
    const chto = result[3];
    const when = result[4].match(/(\d+).(\d+)/);
    const whenHours = when[1];
    const whenMinutes = when[2];

    whenMapping={
      'понедельник':1,
      'вторник':2,
      'среду':3,
      'четверг':4,
      'пятницу':5,
      'субботу':6,
      'воскресенье':0,
    }

    var then = new Date();

    var days = whenMapping[day] - then.getDay();

    if (days<=0) days += 7; 
    then.setDate(then.getDate()+days);
    then.setHours(whenHours, whenMinutes);


    setTimeout(()=> {bot.sendMessage(chatId,`Напоминание: ${chto}`)},then - new Date())

  }

  const napomnyUtrom = (result) => {
    const when = result[1];
    const chto = result[2];

    var then = new Date();

    switch(when) {
      case 'утром': 
        then.setHours(9);
        break;
      case 'днем': 
        then.setHours(13);
        break;
      case 'вечером': 
        then.setHours(18);
        break;
      case 'ночью': 
        then.setHours(22);
        break;
    }

    if (then - new Date() < 0) then.setDate(then.getDate() + 1);

    setTimeout(()=> {bot.sendMessage(chatId,`Напоминание: ${chto}`)},then - new Date())
  }

  const napomnyZavtra = (result) => {
    const when = result[1];
    const chto = result[2];

    var then = new Date();

    switch(when) {
      case 'завтра': 
        then.setDate(then.getDate() + 1);
        then.setHours(9);
        break;
      case 'послезавтра':
      then.setDate(then.getDate() + 2); 
        then.setHours(9);
        break;
    }

    setTimeout(()=> {bot.sendMessage(chatId,`Напоминание: ${chto}`)},then - new Date())
  }

  const napomnyZavtraUtrom = (result) => {
    const whenDay = result[1];
    const whenTime = result[2];
    const chto = result[3];

    switch(whenTime) {
      case 'утром': 
        then.setHours(9);
        break;
      case 'днем': 
        then.setHours(13);
        break;
      case 'вечером': 
        then.setHours(18);
        break;
      case 'ночью': 
        then.setHours(22);
        break;
    }

    switch(when) {
      case 'завтра': 
        then.setDate(then.getDate() + 1);
        break;
      case 'послезавтра':
      then.setDate(then.getDate() + 2);
        break;
    }

    setTimeout(()=> {bot.sendMessage(chatId,`Напоминание: ${chto}`)},then - new Date())
  }

  const napomnyCherez = (result) => {
    const chto = result[1];
    const cherez = result[2];

  }

  const napomnySimple = (result) => {
    const chto = result[1];
    const when = result[2];

  }
  console.log('kek1-->',what.match(/(в|во) (понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье) (.+) в (.+)/));
  switch(true) {
    case !!what.match(/(в|во) (понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье) (.+) в (.+)/): 
      console.log('kek-->')
      napomnyV(what.match(/(в|во) (понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье) (.+) в (.+)/), chatId,bot);
      break;
    case !!what.match(/(утром|днем|вечером|ночью) (.+)/):
      napomnyUtrom(what.match(/(утром|днем|вечером|ночью) (.+)/))
      break; 
    case !!what.match(/(завтра|послезавтра) (.+)/):
      napomnyZavtra(what.match(/(завтра|послезавтра) (.+)/))
      break;
    case !!what.match(/(завтра|послезавтра) (утром|днем|вечером|ночью) (.+)/):
      napomnyZavtraUtrom(what.match(/(завтра|послезавтра) (утром|днем|вечером|ночью) (.+)/))
      break;
    case !!what.match(/(.+) через (.+)/):
      napomnyCherez(what.match(/через (.+)/))
      break;
    case !!what.match(/(.+) в (.+)/):
      napomnySimple(what.match(/(.+) в (.+)/))
      break;
  }


  //if (chatId in napomnis) napomnis[chatId]
  //const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, 'Напоминание получено');
});

// Listen for any kind of message. There are different kinds of
// messages.
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;

//   // send a message to the chat acknowledging receipt of their message
//   bot.sendMessage(chatId, 'Received your message');
// });
