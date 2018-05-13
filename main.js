//lol
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

function ifcb(query, cb){
  if(query) cb(query)
}

class T {
  constructor(){
    this.token = fs.readFileSync('telegram.key', 'utf8').trim();
    this.serviceChatId = 218135295;
    console.log('Token: ', this.token)

    // Create a bot that uses 'polling' to fetch new updates
    this.bot = new TelegramBot(this.token, {polling: true});
    this.prop= 'kek';

    this.emojiDb = 
    this.emojiDb = Object.assign({}, ...JSON.parse(fs.readFileSync('emojiDbEmpty.json', 'utf8')).map(emoji => {var plh={};plh[emoji]=[];return plh}));

    this.VoicesDb = new Datastore({filename : 'voices.db'});
    this.VoicesDb.loadDatabase();
    this.voiceDb = {db:this.VoicesDb};

    this.usersDb = new Datastore({filename : 'users.db'});
    this.usersDb.loadDatabase();

    this.cbr = new CallbackRouter(this);

    this.VoicesDb.find({}, (err, voices) => {
      voices.forEach(voice => {
        this.voiceDb[voice.name] = new Voice(voice.path, voice.name, voice.emojiCode, {fileId:voice.fileId, chatId:voice.chatId});
      });
    })
    
    this.cbr.registerFunction('registerMp3File', (chatId, context, audio) => {
      console.log('register context ->',chatId,context)
      return this.bot.getFile(audio.audio.file_id).then(fileInfo => {
        // console.log('fileUrl--->', fileInfo);
        var fileLink = `https://api.telegram.org/file/bot${this.token}/${fileInfo.file_path}`;
        return rp.get({uri:fileLink, encoding: 'binary'})
        .then(body => {
          let writeStream = fs.createWriteStream(`audios/${chatId}_${audio.audio.file_id}.mp3`);
          writeStream.write(body, 'binary');
          writeStream.on('finish', () => {
            // console.log('wrote all data to file');
            //ffmpeg -i input.mp3 -c:a libopus output.opus
            var command = ffmpeg(`audios/${chatId}_${audio.audio.file_id}.mp3`).audioCodec('libopus').output(`audios/${audio.audio.file_id}.opus`)
            .on('end', () => {
              console.log('context ready --->',context)
              this.createVoice(chatId, `audios/${audio.audio.file_id}.opus`, context.name, context.emojiId, voice => {
                this.usersDb.find({chatId}, (err, res) => {
                  if (res.length) {
                    this.usersDb.update({chatId}, { $push: { userVoices: { $each: [voice.fileId]}}}, {});

                  } else {
                    this.usersDb.insert({chatId, userVoices: [voice.fileId]});
                  }
                })
                // this.usersDb.insert({chatId, userVoices: [voice.fileId]});
                
              });
              // this.usersDb.insert({chatId, userVoices: [audio.audio.file_id]});
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

  createVoice(chatId, path, name, emojiCode, callback){
    console.log('Creating voice')
    this.VoicesDb.find({name, emojiCode, chatId}, (err, foundVoices) => {
      console.log(foundVoices)
      if (!foundVoices.length) {
        console.log(` - Voice Not Found, creating -> name:${name}, path:${path}, emoji:${emoji.get(emojiCode)}`)
        var voice = new Voice(path, name, emojiCode, {VoicesDB:this.VoicesDb, chatId});
        console.log('new Voice',voice)

        this.bot.sendVoice(this.serviceChatId, voice.path)
          .then(answer => {
            var fileId = answer.voice.file_id;
            voice.setFileId(fileId);
            this.voiceDb[name] = voice;
            this.emojiDb[emojiCode] = voice;
            this.VoicesDb.insert(voice.getVoiceData())
            if (callback) callback(voice);
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

    this.bot.onText(/\/sendVoice (.+)\)/, (msg, match) => {
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

    this.bot.onText(/\/reg (.+) (.+)\)/, (msg, match) => {
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
      console.log('receiving audio...')
      if (!this.cbr.execute(audio.chat.id, audio)) {
        console.log('Audio exists-->', audio);
      }
    });

    this.bot.on('voice', voiceMsg => {
      console.log('receiving voice...', voiceMsg)

      this.VoicesDb.find({fileId: voiceMsg.voice.fileId}, (err, [voice]) => {
        if (voice) {
          this.bot.sendMessage(voice.from.id, 'Voice Exists');
        } else {
          //this.bot.sendMessage(voice.from.id, 'Voice not exist');          
        }
      })
      // if (!this.cbr.execute(audio.chat.id, audio)) {
      //   console.log('Audio exists-->', audio);
      // }
    });
    

    // To do:
    // Add /mine/
    this.bot.on('inline_query', (inline_query) => {
      const {id:queryId, from, query:queryText} = inline_query;
      const results = [];
      console.log('inlinequery--->', inline_query)
      //ffmpeg -i input.mp3 -c:a libopus output.opus
      
      ifcb(queryText.match(/mine\)$/), res => {
        console.log('matched *mine, ', res)
        this.VoicesDb.find({chatId: from.id}, (err, voices) => {
          console.log(voices)
          if (voices.length){
            console.log('1=>', voices)
            voices.forEach((voice, i) => {
              this.VoicesDb.find({fileId: voice.fileId}, (err, [voice]) => {
                console.log('2=>', voice)
                results.push({
                  type: 'voice',
                  id: i,
                  voice_file_id: voice.fileId,
                  caption: voice.emojiCode,
                  title: voice.name + voice.emojiCode
                })
                console.log('results => ',results)
                this.bot.answerInlineQuery(queryId, results)
                
                
              })
              
            })
          }
        })
      })
      if (queryText.match(/mine\)$/)) {
        
      } else {
        console.log('queryText: ')
        ifcb(queryText.match(/(.+)\)$/), (res) => {
          console.log('queryText: ', res)
          console.log('matched', res[1])
          var voice = this.voiceDb[res[1]]; // if want to receive more -> make request
          if (voice){
            console.log('voice:==>',voice)
            var v = voice.getVoiceForSend();
            console.log('v--->', v)
            results.push(v)
            console.log('Inline results: ', results)
      
            this.bot.answerInlineQuery(queryId,results)
          } 
          })
        
      }
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