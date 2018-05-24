//AwADBAADkQMAApeh2VMvwPLjrmYooAI
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const Voice = require('./voice');
var Datastore = require('nedb');

var CallbackHistoryDb = require('./callbackHistoryDb');
var CallbackRouter = require('./callbackRouter');
var rp = require('request-promise');

var ffmpeg = require('fluent-ffmpeg');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
// const sequelize = new Sequelize('Voices', null, null, {
//   dialect: "sqlite",
//   storage: './Voices.sqlite',
//   sync: { force: false },
// });
var charsets = {
  mac: {charset:'utf8mb4', collate:'utf8mb4_unicode_ci'},
  raspberry: {charset:'utf8', collate:'utf8_unicode_ci'}
};

var env = 'prod';
const sequelize = new Sequelize('mysql://root:root@localhost/kek');

// const sequelize = new Sequelize('kek', 'root', 'root', {
//   host: 'localhost',
//   dialect: 'mysql',
//   define: {
//     ...(charsets['raspberry']), 
//     timestamps: true
//   },
//   logging:false
// })

sequelize.authenticate().then(function(err) {
    console.log('Connection has been established successfully.');
  }, function (err) {
    console.log('Unable to connect to the database:', err);
});

var Voices = sequelize.define('voices', {
  name: Sequelize.STRING,
  path: Sequelize.STRING,
  fileId: Sequelize.STRING,
  chatId: Sequelize.STRING,
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
},{charset: 'utf8mb4',collate: 'utf8mb4_unicode_ci'});

var Users = sequelize.define('users', {
  firstName: Sequelize.STRING,
  secondName: Sequelize.STRING,
  fav: Sequelize.STRING(685),
  chatId: Sequelize.STRING,
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
},{charset: 'utf8mb4',collate: 'utf8mb4_unicode_ci'});

var Collections = sequelize.define('collections', {
  firstName: Sequelize.STRING,
  secondName: Sequelize.STRING,
  fav: Sequelize.STRING(685),
  chatId: Sequelize.STRING,
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
});

sequelize.sync({ force: false }).then(function(err) {
    console.log('It worked!');
  }, function (err) {
    console.log('An error occurred while creating the table:', err);
});

Voices.sync({force: false}).then(() => {
  // Table created
  // return Voices.create({
  //   name: 'John',
  //   path: 'Hancock'
  // });

  console.log('Sync done...')
});
Voices.sync({force: false}).then(() => {
  // Table created
  return Voices.findAll().then(users => {
    console.log(users)
  })
});

// Voices.findAll().then(users => {
//   console.log(users)
// })



//var command = ffmpeg();

// var express = require('express');
// replace the value below with the Telegram token you receive from @BotFather
// fs.readFile('DATA', 'utf8', function(err, contents) {
//     const token = contents;
// });

function ifcb(query, cb){
  if(query) {console.log('match > ', query);return cb(query)}
  return 0
}

class T {
  constructor(){
    this.token = fs.readFileSync('telegram.key', 'utf8').trim();
    this.serviceChatId = 218135295;
    console.log('Token: ', this.token)

    // Create a bot that uses 'polling' to fetch new updates
    this.bot = new TelegramBot(this.token, {polling: true});
    this.prop= 'kek';

    // this.emojiDb = 
    //this.emojiDb = Object.assign({}, ...JSON.parse(fs.readFileSync('emojiDbEmpty.json', 'utf8')).map(emoji => {var plh={};plh[emoji]=[];return plh}));

    this.VoicesDb = Voices;
    this.voiceDb = {};

    this.usersDb = Users;
    console.log('this.usersDb',this.usersDb)

    this.cbr = new CallbackRouter(this);

    this.cbh = new CallbackHistoryDb();

    // this.VoicesDb.all()
    // .then(voices => {
    //   voices.forEach(voice => {
    //     this.voiceDb[voice.name] = new Voice({path: voice.path, fileId:voice.fileId, chatId:voice.chatId, name:voice.name, emojiCode:voice.emojiCode,});
    //   });
    // })
    
    // this.cbr.registerFunction('registerMp3File', (chatId, context, audio) => {
    //   console.log('register context ->',chatId,context)
    //   return this.bot.getFile(audio.audio.file_id).then(fileInfo => {
    //     // console.log('fileUrl--->', fileInfo);
    //     var fileLink = `https://api.telegram.org/file/bot${this.token}/${fileInfo.file_path}`;
    //     return rp.get({uri:fileLink, encoding: 'binary'})
    //     .then(body => {
    //       let writeStream = fs.createWriteStream(`audios/${chatId}_${audio.audio.file_id}.mp3`);
    //       writeStream.write(body, 'binary');
    //       writeStream.on('finish', () => {
    //         // console.log('wrote all data to file');
    //         //ffmpeg -i input.mp3 -c:a libopus output.opus
    //         var command = ffmpeg(`audios/${chatId}_${audio.audio.file_id}.mp3`).audioCodec('libopus').output(`audios/${audio.audio.file_id}.opus`)
    //         .on('end', () => {
    //           console.log('context ready --->',context)
    //           this.createVoice(chatId, `audios/${audio.audio.file_id}.opus`, context.name, context.emojiId, voice => {
    //             console.log('insert done--')
    //             this.usersDb.find({chatId}, (err, res) => {
    //               if (res.length && voice.fileId) {
    //                 console.log('update start--')
    //                 this.usersDb.update({chatId}, { $push: { userVoices: { $each: [voice.fileId]}}}, {});
    //                 console.log('update done--')
    //               } else {
    //                 console.log('insert start--')
    //                 this.usersDb.insert({chatId, userVoices: [voice.fileId]});
    //                 console.log('insert done--')
    //               }
    //             })
    //             // this.usersDb.insert({chatId, userVoices: [voice.fileId]});
                
    //           });
    //           // this.usersDb.insert({chatId, userVoices: [audio.audio.file_id]});
    //         } ).run();
    //       });
    //       writeStream.end();
    //     })
    //   })
    //   return [0, 0]
    // })
    
    this.cbr.registerFunction('registerIncomingVoice', (chatId, context, [name]) => {
      console.log('rregistering incoming voice ->',chatId,context)
      var {file_id} = context.voiceMsg.voice;
      return this.VoicesDb.findOne({where:{name}}).then(voiceEntry => {
        console.log('voice Sequelize===>', voiceEntry)
        if (!voiceEntry) {
          var voice = new Voice({name, VoicesDB:this.VoicesDb, chatId, fileId: file_id, callback: voice => {
            console.log('--dqdqwdq----->',name,file_id,context,voice, voice.dbEntry)
            this.voiceDb[name] = voice.dbEntry;
            this.bot.sendMessage(chatId, `Voice added!`);
          }});
          // console.log('--dqdqwdq----->',name,file_id,context,voice, voice.dbEntry)
          // this.voiceDb[name] = voice.dbEntry;
          // this.emojiDb[emojiCode] = voice.dbEntry;
          // this.bot.sendMessage(chatId, `Voice added!`);
          return [0, 0]
        } else {
          this.bot.sendMessage(chatId, 'Voice With this name Exists, please supply again')
          return [context, 0]
        }
      })
      // , (err, voices) => {
      //   if (!voices.length) {
      //     var voice = new Voice({name, emojiCode, VoicesDB:this.VoicesDb, chatId, fileId: file_id});
      //     this.voiceDb[name] = voice;
      //     this.emojiDb[emojiCode] = voice;
      //     this.bot.sendMessage(chatId, `Voice added!`);
      //   } else {
      //     voice.sendMessage(chatId, 'Voice With this name Exists, please supply again')
      //     return [1, 0]
      //     // this.cbr.subscribe(chatId, 'registerIncomingVoice', context)
      //   }
      
      
      
      // this.createVoice(chatId, `audios/${audio.audio.file_id}.opus`, name, emojiId, l
      
      return [0, 0]
    })

    this.cbr.registerFunction('registerIncomingAudio', (chatId, context, [name]) => {
      console.log('rregistering incoming audio ->',chatId,context)
      var {fileId} = context.voice;
      console.log('plz fileId ->',fileId)
      return this.VoicesDb.findOne({where:{name}}).then(voiceEntryCheck => {
        console.log('voiceEntryCheck===>', voiceEntryCheck)
        if (!voiceEntryCheck) {
          console.log('voice=>', context.voice)
          context.voice.update({fileId,name}).then(m => {console.log('updated', m)});
          this.voiceDb[name] = context.voice;
          this.bot.sendMessage(chatId, 'Audio Added')
          return [0, 0]
          // , (err, [voice]) => {
          //   //this.VoicesDb.find({fileId:}, (err, voices) => {console.log(voices)})
            
            
          // })
        } else {
          this.bot.sendMessage(chatId, 'Voice With this name Exists, please supply again')
          return [context, 0]
          //this.cbr.subscribe(chatId, 'registerIncomingAudio', context)
        }
      })
    })

    this.cbr.registerFunction('editName', (chatId, context, [newName]) => {
       
      var {fileId} = context;
      console.log('plz fileId ->',fileId)
      return this.VoicesDb.findOne({where:{fileId}}).then(voice => {
        console.log('voiceEntryCheck===>', voice)
        if (voice) {
          //console.log('voice=>', context.voice)
          //context.voice.update({fileId,name, emojiCode}).then(m => {console.log('updated', m)});
          delete this.voiceDb[voice.name]
          
          voice.update({name: newName})
          this.voiceDb[newName] = voice;

          this.bot.sendMessage(chatId, 'VoiceEdited')
          return [0, 0]
          // , (err, [voice]) => {
          //   //this.VoicesDb.find({fileId:}, (err, voices) => {console.log(voices)})
            
            
          // })
        } else {
          this.bot.sendMessage(chatId, 'Error')
          return [context, 0]
          //this.cbr.subscribe(chatId, 'registerIncomingAudio', context)
        }
      })

      
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

  createVoice(chatId, path, callback){
    console.log('Creating voice')

    var voice = new Voice({path, VoicesDB:this.VoicesDb, chatId});
    console.log('new Voice',voice)

    this.bot.sendVoice(this.serviceChatId, voice.path)
    .then(answer => {
      console.log('answer--->', answer)
      var fileId = answer.voice.file_id;
      this.VoicesDb.findOne({where:{chatId, path}}).then(voice => {
        voice.update({fileId}).then(voiceUpd => {
          if (callback) callback(voiceUpd);
        })
      })
      // voice.syncDb({additions:{fileId}, search:{chatId, path}}, newVoice => {
      //   if (callback) callback(newVoice);
      // });
      // this.voiceDb[name] = voice;
      // this.emojiDb[emojiCode] = voice;
      //voice.addVoicesDb(this.VoicesDb);
      //this.VoicesDb.insert(voice.getVoiceData())
      // console.log('insert done--')
      // if (callback) callback(voice);
      // console.log('lol4=>')
    });
    // this.VoicesDb.find({name, emojiCode, chatId}, (err, foundVoices) => {
    //   console.log(foundVoices)
    //   if (!foundVoices.length) {
    //     console.log(` - Voice Not Found, creating -> name:${name}, path:${path}, emoji:${emoji.get(emojiCode)}`)
    //     var voice = new Voice({path, VoicesDB:this.VoicesDb, chatId});
    //     console.log('new Voice',voice)

    //     this.bot.sendVoice(this.serviceChatId, voice.path)
    //       .then(answer => {
    //         console.log('answer--->', answer)
    //         var fileId = answer.voice.file_id;
    //         voice.setFileId(fileId);
    //         this.voiceDb[name] = voice;
    //         this.emojiDb[emojiCode] = voice;
    //         voice.addVoicesDb(this.VoicesDb);
    //         //this.VoicesDb.insert(voice.getVoiceData())
    //         console.log('insert done--')
    //         if (callback) callback(voice);
    //       });
          
        
    //   }
    //   else {
    //     console.log(` - Voice Found, skipping name:${name}, path:${path}, emoji:${emoji.get(emojiCode)}`)
    //   }
    // })
  }

  register(){


    this.bot.onText(/\/echo (.+)/, (msg, match) => {
      // 'msg' is the received Message from Telegram
      // 'match' is the result of executing the regexp above on the text content
      // of the message
    
      const chatId = msg.chat.id;
      const resp = match[1]; // the captured "whatever"
    
      console.log(`message: ${resp}}`);
    
      // send back the matched "whatever" to the chat
      this.bot.sendMessage(chatId, chatId+' -> '+resp);
    });

    this.bot.onText(/\/sendOgg (.+)\)/, (msg, match) => {

      console.log('sendVoiceOgg',msg, match)
      const chatId = msg.chat.id;
      const resp = match[1]; // the captured "whatever"
      //var voice = this.voiceDb[resp];

      console.log('SendVoice--->', chatId, 'audios/'+resp)
      this.bot.sendVoice(chatId, 'audios/'+resp, {caption: 'TakeIt'})
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
      console.log('SendVoice--->', chatId, voice.path,voice.fileId)
      this.bot.sendVoice(chatId, voice.fileId?voice.fileId:voice.path, {caption: 'sosi'})
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



    this.bot.onText(/\/reg (.+)\)/, (msg, match) => {
      // 'msg' is the received Message from Telegram
      // 'match' is the result of executing the regexp above on the text content
      // of the message
      console.log('kek')
      const chatId = msg.chat.id;
      const name = match[1]; // the captured "whatever"
      //for (let i=0;i<emojiId.length;i++) console.log(emojiId,emojiId[i]);
      

      //this.cbr.subscribe(chatId,'registerMp3File',{name, emojiId})
      this.bot.sendMessage(chatId, `Thank you, please send your mp3 file...lol`);
      //for (let i=0;i<emojiId.length;i++) console.log(emojiId,emojiId[i]);

      // this.bot.sendVoice(chatId, voice.path)
      // .then(answer => {
      //   var fileId = answer.voice.file_id;
      //   voice.setFileId(fileId);
 
    });

    // this.bot.onText(/^([^/][a-zA-Zа-яА-Я0-9 /)]+)$/, (msg, match) => {
    //   const chatId = msg.chat.id;
    //   console.log('chatId===>', chatId)
      
    //   if (!this.cbr.execute(chatId, [match[1]])) {
    //     console.log('registered -->', match);
    //   } else {
    //     this.bot.sendMessage(chatId, 'wtf?');
    //   }

      
    // });

    this.bot.onText(/^([^/].+)$/, (msg, match) => { // ^([^/][a-zA-Zа-яА-Я0-9 /)]+)$
      const chatId = msg.chat.id;
      console.log('chatId===>', chatId)
      
      if (!this.cbr.execute(chatId, [match[1]])) {
        console.log('registered -->', match);
      } else {
        this.bot.sendMessage(chatId, 'wtf?');
      }

      
    });
    

    this.bot.onText(/\/manage/, (msg, match) => {
      const chatId = msg.chat.id;
      console.log('Manage chatId===>', chatId)

      var x = (new Date()).getHours();
      var questions = [
        {
          title:"`Good ${17<x || x<5?'Evening':x<12?'Morning':'Afternoon'}, please choose ...`",
          buttons: [
            [{ text: 'Fav', callback_data:  JSON.stringify({index: 'main', button: 'fav'}) }, { text: 'My songs', callback_data: JSON.stringify({index: 'main', button: 'mine'}) }],
            [{ text: 'Paki', callback_data:  JSON.stringify({index: 'main', button: 'lol'})},     { text: 'Lox', callback_data: JSON.stringify({index: 'main', button: 'lol'}) }]
            ]
        }
      ]

      try {
        var text = eval(questions[0].title);
        console.log(`text----->`, text);
        var options = {
          reply_markup: JSON.stringify({
            inline_keyboard: questions[0].buttons,
            parse_mode: 'Markdown'
          })
        };
        console.log(`sendMessage`);
        this.bot.sendMessage(chatId, text, options)
        console.log(`message Sent`);
      } catch (e) {
        console.log('Error',e)
      }

      

      
    });

    var getButtons = (page, length, index) => {
      var maxPages = Math.floor(length/5) + 1;
      if (maxPages <= 1) return []
      var pages =[];
      if (page<3) {
        pages = Array.from({ length: maxPages>=5?5:maxPages }, (v, k) => [page,(k+1).toString()]) 

        // var page = Math.floor(num/5);

        pages[page][1] = '('+(page+1).toString()+')';
      } else if (page<maxPages-3) {
        pages = [ [page, (page-2).toString()],[page, (page-1).toString()],[page, '.'+(page).toString()+'.'],[page, (page+1).toString()],[page, (page+2).toString()] ];
      } else {
        pages = Array.from({ length: maxPages>=5?5:maxPages }, (v, k) => [page, (k+maxPages-5).toString()])
        pages[maxPages - page - 5][1] = '('+(page+1).toString()+')'; 
        
        //pages = [ (maxPages-5).toString(),(maxPages-4).toString(),'.'+(maxPages-3).toString()+'.',(maxPages-2).toString(),(maxPages-1).toString() ];
      }

      return [pages.map(page => ({
        text: page[1],
        callback_data: JSON.stringify({index, page: page[0]})
      }))]
      // var numbers = [[0,1,2,3,4], [0,1,2,3,4], [0,1,2,3,4], [1,2,3,4,5], [2,3,4,5,6], [3,4,5,6,7], [3,4,5,6,7], [3,4,5,6,7]];
    }

    var lowerMenu = (chatId) => {
      var backButton = this.cbh.back(chatId, {});
      var mainMenuButton = {
        text: "Menu",
        callback_data: JSON.stringify({index: 'menu'})
      };
      return [...backButton, mainMenuButton]
    }

    var lowerMenuEnhanced = (buttons, chatId) => {
      var backButton = this.cbh.back(chatId, {});
      var mainMenuButton = {
        text: "Menu",
        callback_data: JSON.stringify({index: 'menu'})
      };
      buttons.push([...backButton, mainMenuButton])
      return buttons
    }

    var addBackButton = (buttons, chatId) => {
      var backButton = this.cbh.back(chatId, {});
      buttons.push(backButton);
      return buttons;
    }

    var pageVoices = (chatId, voices, page, index) => {
      var buttons =[];
      var length = voices.length;

      for (var i=page*5; i<page*5+5 && i<voices.length;i++) {
        var voice = voices[i];
        buttons.push([{
          text: voice.name,
          callback_data: JSON.stringify({index: 'song', fileId: voice.fileId})
        }])
      }
      
      var pages = getButtons(page, length, index)
      // buttons.push(...pages, lowerMenu(chatId))
      buttons.push(...pages)
      buttons = lowerMenuEnhanced(buttons, chatId)

      return buttons
    }

    var sendMessageOrEdit = (chatId, text, options, toEdit) =>{
      if (toEdit) {
        return this.bot.editMessageText(text, Object.assign(options, {
          chat_id: chatId,
          message_id: toEdit,
        }));

      } else {
        return this.bot.sendMessage(chatId, text, options)
      }
    }

    this.bot.on('callback_query', (msg) =>  {
      const inline_message_id = msg.id
      const chatId = msg.from.id;
      var data = msg.data;
      var answer = JSON.parse(data)
      // var answer = data.split('_');
      // var index = answer[0];
      // var button = answer[1];
      // var page = answer[2] || 0;
      var { index, button, page, fileId, toEdit } = answer;
      if (!page) page = 0;
      if (!toEdit) toEdit = msg.message.message_id;
      console.log(`callback_query: data:${data}, index:${index}, button:${button}, page:${page}, `, msg);

      this.cbh.add(chatId, data);

      console.log('Added,',chatId,data)
      if (index == 'main') {
        if (button == 'fav'){
          console.log('this.usersDb1',this.usersDb)
          this.usersDb.findOne({where:{chatId}})
          .then(user => {
            if (user){
              var fav = JSON.parse(user.fav);
              this.VoicesDb.findAll({where: {
                fileId: fav
              }}).then(voices => {
                console.log('voices===>', voices);
                var buttons = pageVoices(chatId, voices, page, index)

                var text = 'Fav Songs, page: '+page.toString();
                var options = {
                  reply_markup: JSON.stringify({
                    inline_keyboard: buttons,
                    parse_mode: 'Markdown'
                  })
                };
                sendMessageOrEdit(chatId, text, options, toEdit)
              
              })
            } else {
              var text = 'You have no fav songs, probably u are not in sys';
                var options = {
                  reply_markup: JSON.stringify({
                    inline_keyboard: [[{
                      text,
                      callback_data: JSON.stringify({index: 'menu'})
                    }]],
                    parse_mode: 'Markdown'
                  })
                };
                sendMessageOrEdit(chatId, text, options, toEdit)
            }
          })
        } else if (button == 'mine') {
          console.log('user pressed mine button in menu')
          var buttons = [];
          this.VoicesDb.findAll({where:{chatId}}).then(voices => {
            var buttons = pageVoices(chatId, voices, page, index)
            var text = 'My Songs, page: '+page.toString();
            var options = {
              reply_markup: JSON.stringify({
                inline_keyboard: buttons,
                parse_mode: 'Markdown'
              })
            };
            sendMessageOrEdit(chatId, text, options, toEdit)
          })
            

        }
        
      }else if (index == 'song') {
        if (!fileId) throw new Error('Activated voice with no id, not good');
        this.VoicesDb.findOne({where:{fileId}}).then(voice => {
          if (!voice) throw new Error('No voice found');
          this.usersDb.findOne({where: {chatId}}).then(user => {
            if (user && user.fav) {
              console.log('user fav ==>,',user.fav)
              var favs = JSON.parse(user.fav);
              if (favs.includes(voice.fileId)) {
                var addDelFavButton = [{text: 'Delete from fav', callback_data: JSON.stringify({index: 'deleteFav', fileId: voice.fileId})}]
              } else {
                var addDelFavButton = [{text: 'Add to fav', callback_data: JSON.stringify({index: 'addFav', fileId: voice.fileId})}]
              }

              var ownerButtons = [
                [{text: 'Edit name', callback_data: JSON.stringify({index: 'editName', fileId: voice.fileId}) }],
                [{text: 'Delete Voice', callback_data: JSON.stringify({index: 'delete', fileId: voice.fileId})}]
              ]
              var buttons = [
                ...(voice.chatId == chatId?ownerButtons:[]),
                addDelFavButton
              ]
    
              var text = `Voice: ${voice.name},\nYour actions:`;
              var options = {
                reply_markup: JSON.stringify({
                  inline_keyboard: buttons,
                  parse_mode: 'Markdown'
                })
              };
              sendMessageOrEdit(chatId, text, options) //, toEdit
            } else {
              var buttons = lowerMenu(chatId);
              var text = `No voices in fav or user haven't uploaded yet`
              var options = {
                reply_markup: JSON.stringify({
                  inline_keyboard: buttons,
                  parse_mode: 'Markdown'
                })
              };
              sendMessageOrEdit(chatId, text, options) //, toEdit
            }
            

          })

          
        })

      } else if (index == 'deleteFav') {
        this.usersDb.findOne({where:{chatId}})
          .then(user => {
            if (user && fileId){
              var fav = JSON.parse(user.fav);
              if (fav) {
                var ind = fav.indexOf(fileId);
                if (ind != -1) {
                  fav = [...fav.slice(0,ind), ...fav.slice(ind+1)]
                  user.update({fav:JSON.stringify(fav)});
                  console.log('1',fav)

                  var buttons = [];
                  buttons = lowerMenuEnhanced(buttons, chatId);
                  console.log('2',buttons)

                  var backListButton = this.cbh.back(chatId, {switchKey:'lastNormal'});
                  console.log('3',backListButton)
                  backListButton[0].text = 'Back to voice list';
                  console.log('4',backListButton)
                  buttons.push(backListButton)
                  console.log('5',buttons)

                  var text = `Deleted from Fav`;
                  var options = {
                    reply_markup: JSON.stringify({
                      inline_keyboard: buttons,
                      parse_mode: 'Markdown'
                    })
                  };
                  sendMessageOrEdit(chatId, text, options, toEdit) //, toEdit
                }
              }
            }
          })

      } else if (index == 'addFav') {
        this.usersDb.findOne({where:{chatId}})
          .then(user => {
            if (user && fileId){
              var fav = JSON.parse(user.fav);
              if (fav) {
                var ind = fav.indexOf(fileId);
                if (ind == -1) {
                  fav.push(fileId)
                  user.update({fav:JSON.stringify(fav)});

                  var buttons = lowerMenuEnhanced([], chatId);

                  var backListButton = this.cbh.back(chatId, {switchKey:'lastNormal'});
                  backListButton[0].text = 'Back to voice list';
                  buttons.push(backListButton)
                  
                  var text = `Added to Fav`;
                  var options = {
                    reply_markup: JSON.stringify({
                      inline_keyboard: buttons,
                      parse_mode: 'Markdown'
                    })
                  };
                  sendMessageOrEdit(chatId, text, options, toEdit) //, toEdit
                }
              }
            }
          })
      } else if (index == 'editName') {
        this.cbr.subscribe(chatId,'editName',{fileId})

        var text = `Please send the new name followed by two brackets: new name))`;
        sendMessageOrEdit(chatId, text, {}, toEdit)

      } else if (index == 'delete') { // deal to delete from all favs and packs, or make all access functions troubleshoot on empty voice/ or delete the possibility to remove audio/ but it is shit
        this.VoicesDb.findOne({where:{fileId}})
          .then(voice => {
            if (voice && voice.chatId == chatId){
              delete this.voiceDb[voice.name];

              voice.destroy();

              var buttons = lowerMenuEnhanced([], chatId);

              var [backListButton] = this.cbh.back(chatId, {switchKey:'lastNormal'});
              
              buttons[0][0] = backListButton;

              var text = `Voice deleted`;
                  var options = {
                    reply_markup: JSON.stringify({
                      inline_keyboard: buttons,
                      parse_mode: 'Markdown'
                    })
                  };
                  sendMessageOrEdit(chatId, text, options, toEdit) //, toEdit
            }
          })

      } else if (index == 'lol') {
      }
      else if (index == 'menu') {
        console.log('Manue requested===>', chatId)
        var x = (new Date()).getHours();
        var questions = [
          {
            title:"`Good ${17<x || x<5?'Evening':x<12?'Morning':'Afternoon'}, please choose ...`",
            buttons: [
                [{ text: 'Fav', callback_data:  JSON.stringify({index: 'main', button: 'fav'}) }, { text: 'My songs', callback_data: JSON.stringify({index: 'main', button: 'mine'}) }],
                [{ text: 'Paki', callback_data:  JSON.stringify({index: 'main', button: 'lol'})},     { text: 'Lox', callback_data: JSON.stringify({index: 'main', button: 'lol'}) }]
              ]
          }
        ]

        try {
          var text = eval(questions[0].title);
          console.log(`text----->`, text);
          var options = {
            reply_markup: JSON.stringify({
              inline_keyboard: questions[0].buttons,
              parse_mode: 'Markdown'
            })
          };
          console.log(`sendMessage`);
          sendMessageOrEdit(chatId, text, options, toEdit)
          console.log(`message Sent`);
        } catch (e) {
          console.log('Error',e)
        }
        
      } else if (index == 'back') {
        this.bot.sendMessage(chatId,'Lol ')
      }
    
      this.bot.answerCallbackQuery(msg.id);
      


    });

    this.bot.onText(/\/cancel/, (msg, match) => {
      const chatId = msg.chat.id;
      console.log('chatIdCancel===>', chatId)
      this.cbr.cancel(chatId);

      
    });

    this.bot.on('audio', audio => {
      var chatId = audio.from.id;
      console.log('receiving audio...', chatId, audio)
      // console.log('register context ->',chatId,context)
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
              // console.log('context ready --->',context)
              //var context = {audio};
              this.createVoice(chatId, `audios/${audio.audio.file_id}.opus`, voice => {
                console.log('lol1=>', voice)
                this.cbr.subscribe(chatId, 'registerIncomingAudio', {voice})
                console.log('lol2=>')
                this.bot.sendVoice(chatId, voice.fileId, {caption: 'Please supply the name followed by one bracket: My new voice name 🤓)'})
                console.log('lol3=>')
                // console.log('insert done--')
                // this.usersDb.find({chatId}, (err, res) => {
                //   if (res.length && voice.fileId) {
                //     console.log('update start--')
                //     this.usersDb.update({chatId}, { $push: { userVoices: { $each: [voice.fileId]}}}, {});
                //     console.log('update done--')
                //   } else {
                //     console.log('insert start--')
                //     this.usersDb.insert({chatId, userVoices: [voice.fileId]});
                //     console.log('insert done--')
                //   }
                // })
                // // this.usersDb.insert({chatId, userVoices: [voice.fileId]});
                
              });
              
              // this.usersDb.insert({chatId, userVoices: [audio.audio.file_id]});
            } ).run();
          });
          writeStream.end();
        })
      })

      // console.log('receiving audio...')
      // if (!this.cbr.execute(audio.chat.id, audio)) {
      //   console.log('Audio exists-->', audio);
      // } else {
        
      // }
    });

    this.bot.on('voice', voiceMsg => {
      console.log('receiving voice...', voiceMsg)
      var chatId = voiceMsg.from.id
      var fileId = voiceMsg.voice.file_id

      this.VoicesDb.findOne({where: {fileId}}).then(voice => {
        if (voice && fileId) {
          this.bot.sendMessage(chatId, 'Voice Exists now in your /fav');
          this.usersDb.findOne({where:{chatId}}).then(user => {
            if (user) {
              console.log('update start--')
              var userFavs = JSON.parse(user.fav)
              console.log('userFavs', userFavs,fileId)
              if (!userFavs.includes(fileId)){
                userFavs.push(fileId)
                console.log('userFavs start--',userFavs)
                user.update({fav:JSON.stringify(userFavs)});
                console.log('update done--')
              } else {
                console.log('/fav already exists',userFavs)
              }
              
            } else {
              console.log('insert start--')
              this.usersDb.create({chatId, fav: JSON.stringify([fileId])});
              console.log('insert done--')
            }
          })
          // , (err, [res]) => {
            
          // })
          
          // add to favorites
        } else {
          this.cbr.subscribe(chatId,'registerIncomingVoice', {voiceMsg})
          this.bot.sendMessage(chatId, 'Voice received, please supply the name followed by one bracket: My new voice name 🤓)');
          //this.bot.sendMessage(voice.from.id, 'Voice not exist');          
        }
      })
      // , (err, [voice]) => {
        
      // })
      // if (!this.cbr.execute(audio.chat.id, audio)) {
      //   console.log('Audio exists-->', audio);
      // }
    });
    

    // To do:
    // Add /mine/
    this.bot.on('inline_query', (inline_query) => {
      const {id:queryId, from, query:queryText} = inline_query;
      const chatId = from.id;
      const results = [];
      console.log('inlinequery--->', inline_query)
      //ffmpeg -i input.mp3 -c:a libopus output.opus
      //Webmtomp3
      //ffmpeg -i videoplayback -vn -ab 128k -ar 44100 -y videoplayback.mp3
      //ffmpeg -ss 2 -t 3.5 -i videoplayback.mp3 -acodec copy mineplatim.mp3
      //ffmpeg -ss 7 -t 6.5 -i videoplayback.mp3 -acodec copy daydesyatku.mp3
      //ffmpeg -ss 42 -t 3.2 -i videoplayback.mp3 -acodec copy abonent.mp3
      
      switch (true) {
        case !!ifcb(queryText.match(/mine\)$/), res => {
          console.log('matched *mine, ', res)
          this.VoicesDb.findAll({where:{chatId}}).then(voices => {
            voices.forEach((voice, i) => {
              results.push({
                type: 'voice',
                id: i.toString(),
                voice_file_id: voice.fileId,
                // caption: voice.emojiCode,
                title: voice.name
              })
              // if (i==voices.length-1) {
              //   console.log(`results => ${i},${voices.length-1},${results}`)
              //   this.bot.answerInlineQuery(queryId, results)
              // } else {
              //   console.log('i,vlength->', i,voices.length-1)
              // }
            })
            this.bot.answerInlineQuery(queryId, results)




            // if (voices.length){
            //   console.log('1=>', voices)
            //   voices.forEach((voice, i) => {
            //     this.VoicesDb.find({fileId: voice.fileId}, (err, [voiceFromDb]) => {
            //       console.log('2=>', voiceFromDb)
            //       results.push({
            //         type: 'voice',
            //         id: i.toString(),
            //         voice_file_id: voiceFromDb.fileId,
            //         // caption: voice.emojiCode,
            //         title: voiceFromDb.name + voiceFromDb.emojiCode
            //       })
            //       if (i==voices.length-1) {
            //         console.log(`results => ${i},${voices.length-1},${results}`)
            //         this.bot.answerInlineQuery(queryId, results)
            //       } else {
            //         console.log('i,vlength->', i,voices.length-1)
            //       }
            //       console.log('results => ',results)
            //     })
                
            //   })
            //   // console.log('results => ',results)
            //   // return this.bot.answerInlineQuery(queryId, results)
            // }


          })
        }):
          break;
        case !!ifcb(queryText.match(/fav\)$/), res => {
          console.log('matched *fav, ', res)
          this.usersDb.findOne({where:{chatId}})
          .then(user => {
            if (user){
              var fav = JSON.parse(user.fav);
              this.VoicesDb.findAll({where: {
                fileId: fav
              }}).then(voices => {
                console.log('voices===>', voices)
                voices.forEach((voice, i) => {
                  results.push({
                    type: 'voice',
                    id: i.toString(),
                    voice_file_id: voice.fileId,
                    // caption: voice.emojiCode,
                    title: voice.name
                  })
                  // if (i==voices.length-1) {
                  //   console.log(`results => ${i},${voices.length-1},${results}`)
                  //   this.bot.answerInlineQuery(queryId, results)
                  // } else {
                  //   console.log('i,vlength->', i,voices.length-1)
                  // }
                })
                this.bot.answerInlineQuery(queryId, results)
              })
            } else{
              console.log('DuHastKeinVoices')
            }
          })

          // , (err, [{fav}]) => {
          //   console.log('fav--->', fav)
          //   fav.forEach( (voiceFileId, i) => {
          //     this.VoicesDb.find({fileId: voiceFileId}, (err, [voice]) => {
          //       console.log('Adding audio-->',voice)
          //       if (voice) {
          //         results.push({
          //           type: 'voice',
          //           id: i.toString(),
          //           voice_file_id: voice.fileId,
          //           // caption: voice.emojiCode,
          //           title: voice.name + voice.emojiCode
          //         })
          //         if (i==fav.length-1) {
          //           console.log(`results => ${i},${fav.length-1},${results}`,results)
          //           this.bot.answerInlineQuery(queryId, results)
          //         }
          //       }
          //     })
          //   })
            
          // })
        }):
          break;
        case !!ifcb(queryText.toLowerCase().match(/([\wа-яА-Я, ]+)$/), (res) => {
          var match = res[1];
          try{
            console.log('queryText: ', res)
            console.log('matched', res[1])
            // var voice = this.voiceDb[res[1]]; // if want to receive more -> make request
            var matcher = new RegExp(match, 'i');
            let i = 0;
            var results = Object.keys(this.voiceDb).filter(key => matcher.test(key)).map(key => ({
              type:'voice',
                    id: i++,
                    voice_file_id: this.voiceDb[key].fileId,
                    title: this.voiceDb[key].name
            }));
            if (results.length>0){
              this.bot.answerInlineQuery(queryId,results)
            } else {
              console.log('Nomatch--> ', match)
            }
          } catch(e){
            console.log('eeeeeeeee>', e)
            console.log('------', this.voiceDb)
          }
          
          

          // this.VoicesDb.find({name: {
          //     "$regex": new RegExp(match, 'i'),
          // }}, (err, voices) => {
          //   if (!err) {
          //     if (voices.length){
          //       console.log('search results => ', voices)
          //       let i = 0;
          //       var results = voices.map(voice => ({
          //         type:'voice',
          //               id: i++,
          //               voice_file_id: voice.fileId,
          //               title: voice.name + ' ' + voice.emojiCode
          //       }))
          //       this.bot.answerInlineQuery(queryId,results)
          //     } else {
          //       console.log(`lol -> [${match}], ${voices}`,voices)
          //     }
          //   } else {
          //     console.log('error->', err)
          //     return err
          //   }
            
            
  
            
          // })
          //searchString = searchString.split(' ').join('|');
          //var regex = new RegExp(searchString, `i`);
  
          // if (voice){
          //   console.log('voice:==>',voice)
          //   var v = voice.getVoiceForSend();
          //   console.log('v--->', v)
          //   results.push(v)
          //   console.log('Inline results: ', results)
      
          //   this.bot.answerInlineQuery(queryId,results)
          // } 
        }):
          break;
        default: 
          console.log(chatId,'Not recognised' + queryText)

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