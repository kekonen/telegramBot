const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const Voice = require('./voice');
var emoji = require('node-emoji');
var Datastore = require('nedb');
var CallbackRouter = require('./callbackRouter');
var rp = require('request-promise');

var ffmpeg = require('fluent-ffmpeg');
//var command = ffmpeg();

// var express = require('express');
// replace the value below with the Telegram token you receive from @BotFather
// fs.readFile('DATA', 'utf8', function(err, contents) {
//     const token = contents;
// });


class T {
  constructor(){
    this.token = fs.readFileSync('telegram.key', 'utf8').trim();
    this.serviceChatId = 218135295;
    console.log('Token: ', this.token)

    // Create a bot that uses 'polling' to fetch new updates
    this.bot = new TelegramBot(this.token, {polling: true});
    this.prop= 'kek';

    this.emojiDb = Object.assign({}, ...JSON.parse(fs.readFileSync('emojiDbEmpty.json', 'utf8')).map(emoji => {var plh={};plh[emoji]=[];return plh}));
    this.voiceDb = {};

    this.db = new Datastore({filename : 'files.db'});
    this.db.loadDatabase();
    this.cbr = new CallbackRouter(this);

    this.db.find({type: 'voice'}, (err, voices) => {
      voices.forEach(voice => {
        this.voiceDb[voice.name] = new Voice(voice.path, voice.name, voice.emojiCode, voice.fileId)
      });
    })
    
    this.cbr.registerFunction('registerMp3File', (chatId, context, audio) => {
      console.log('lol->',chatId,context)
      return this.bot.getFile(audio.audio.file_id).then(fileInfo => {
        console.log('fileUrl--->', fileInfo);
        var fileLink = `https://api.telegram.org/file/bot${this.token}/${fileInfo.file_path}`;
        return rp.get({uri:fileLink, encoding: 'binary'})
        .then(body => {
          let writeStream = fs.createWriteStream(`audios/${chatId}_${audio.audio.file_id}.mp3`);
          writeStream.write(body, 'binary');
          writeStream.on('finish', () => {
            console.log('wrote all data to file');
            var command = ffmpeg(`audios/${chatId}_${audio.audio.file_id}.mp3`).audioCodec('libopus').output(`audios/${audio.audio.file_id}.opus`)
            .on('end', () => {
              console.log('context',context)
              this.createVoice(`audios/${audio.audio.file_id}.opus`, context.name, context.emojiId);
            } ).run();
          });
          writeStream.end();
        })
      })
      return this.bot.sendMessage(chatId, this.prop);
    })
    
    
    //console.log(this.emojiDb);
    
    // this.voiceDb['hitman'] = new Voice('audios/1.opus', 'hitman', 'knife');
    // this.voiceDb['scarface'] = new Voice('audios/2.opus', 'scarface', 'sunglasses');

    // this.emojiDb['knife'] = this.voiceDb['hitman'];
    // this.emojiDb['sunglasses'] = this.voiceDb['scarface'];

    // ---------------------------   this.createVoice('audios/1.opus', 'hitman', 'knife');
    // ---------------------------   this.createVoice('audios/2.opus', 'scarface', 'sunglasses');

    // var app = express();
    // this.port = 8077;
    // this.mask = 'http';
    // this.domain = 'localhost'
    // app.get('/', function (req, res) {
    //   res.send('Hello World!');
    // });

    // app.use('/voice', express.static('audios'))
    // console.log(this.port)
    // app.listen(this.port, () => {
    //   console.log(`Example app listening on port ${this.port}!`);
    // });

  }

  createVoice(path, name, emojiCode){
    console.log('Creating voice')
    this.db.find({path, name, emojiCode}, (err, foundVoices) => {
      console.log(foundVoices)
      if (!foundVoices.length) {
        console.log(` - Voice Not Found, creating -> name:${name}, path:${path}, emoji:${emoji.get(emojiCode)}`)
        var voice = new Voice(path, name, emojiCode);

        this.bot.sendVoice(this.serviceChatId, voice.path)
          .then(answer => {
            var fileId = answer.voice.file_id;
            voice.setFileId(fileId);
            this.voiceDb[name] = voice;
            this.emojiDb[emojiCode] = voice;
            console.log('voice data ------>',voice.getVoiceData())
            this.db.insert(voice.getVoiceData())
          });
          
        
      }
      else {
        console.log(` - Voice Found, skipping name:${name}, path:${path}, emoji:${emoji.get(emojiCode)}`)
      }
    })
  }

  register(){
    this.bot.onText(/\/echo (.+)/, (msg, match) => {
      // 'msg' is the received Message from Telegram
      // 'match' is the result of executing the regexp above on the text content
      // of the message
    
      const chatId = msg.chat.id;
      const resp = match[1]; // the captured "whatever"
    
      console.log(`message: ${resp}, ${emoji.which(resp)}`);
    
      // send back the matched "whatever" to the chat
      this.bot.sendMessage(chatId, chatId+' -> '+resp);
    });

    this.bot.onText(/\/sendVoice (.+)/, (msg, match) => {
      // 'msg' is the received Message from Telegram
      // 'match' is the result of executing the regexp above on the text content
      // of the message
    
      const chatId = msg.chat.id;
      const resp = match[1]; // the captured "whatever"
      var voice = this.voiceDb[resp];
    
      //console.log(`message: ${resp}, ${emoji.which(resp)}`);
    
      // send back the matched "whatever" to the chat
      console.log('SendVoice--->', chatId, voice.path, voice.emojiCode,voice.fileId)
      this.bot.sendVoice(chatId, voice.fileId?voice.fileId:voice.path, {caption: voice.emojiCode})
      // .then(answer => {
      //   var fileId = answer.voice.file_id;
      //   voice.setFileId(fileId);
      // });
      // const chatId = msg.chat.id;
      // const resp = match[1]; // the captured "whatever"
      // var voice = this.voiceDb[resp];
    
      // //console.log(`message: ${resp}, ${emoji.which(resp)}`);
    
      // // send back the matched "whatever" to the chat
      // this.bot.sendVoice(chatId, voice.path)
      // .then(answer => {
      //   var fileId = answer.voice.file_id;
      //   voice.setFileId(fileId);
      // });
    });

    this.bot.onText(/\/registerVoice (.+) (.+)/, (msg, match) => {
      // 'msg' is the received Message from Telegram
      // 'match' is the result of executing the regexp above on the text content
      // of the message
      console.log('kek')
      const chatId = msg.chat.id;
      const name = match[1]; // the captured "whatever"
      const emojiId = match[2];
      //for (let i=0;i<emojiId.length;i++) console.log(emojiId,emojiId[i]);
      console.log('msg: ',emojiId)
      

      this.cbr.subscribe(chatId,'registerMp3File',{name, emojiId})
      this.bot.sendMessage(chatId, `Thank you, please send your mp3 file...${emojiId}`);
      //for (let i=0;i<emojiId.length;i++) console.log(emojiId,emojiId[i]);

      // this.bot.sendVoice(chatId, voice.path)
      // .then(answer => {
      //   var fileId = answer.voice.file_id;
      //   voice.setFileId(fileId);
      // });
    });

    this.bot.on('audio', audio => {
      console.log('start on audio')
      if (!this.cbr.execute(audio.chat.id, audio)) {
        console.log('audio-->', audio);
      }
    })
    
    this.bot.onText(/\/напомни (.+)/, (msg, match) => {
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
    
        setTimeout(()=> {this.bot.sendMessage(chatId,`Напоминание: ${chto}`)},then - new Date())
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
    
        setTimeout(()=> {this.bot.sendMessage(chatId,`Напоминание: ${chto}`)},then - new Date())
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
    
        setTimeout(()=> {this.bot.sendMessage(chatId,`Напоминание: ${chto}`)},then - new Date())
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
          napomnyV(what.match(/(в|во) (понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье) (.+) в (.+)/), chatId,this.bot);
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
      this.bot.sendMessage(chatId, 'Напоминание получено');
    });
    

    // To do:
    // Add /mine/
    this.bot.on('inline_query', (inline_query) => {
      const {id:queryId, from, query:queryText} = inline_query;
      const results = [];
      //ffmpeg -i input.mp3 -c:a libopus output.opus
      var voice = this.voiceDb[queryText]
      var [mask, domain, path, port] = [this.mask, this.domain, voice.path, this.port]
      results.push({
        type:'voice',
        id:'1',
        voice_file_id: voice.fileId,
        title: voice.name,
        caption: emoji.unemojify(voice.emojiCode)
      })
      console.log('Inline results: ', results)

      this.bot.answerInlineQuery(queryId,results)
    })
  }
}


// Matches "/echo [whatever]"


// Listen for any kind of message. There are different kinds of
// messages.
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;

//   // send a message to the chat acknowledging receipt of their message
//   bot.sendMessage(chatId, 'Received your message');
// });

var t = new T();
t.register();