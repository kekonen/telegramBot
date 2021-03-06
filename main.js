//AwADBAADkQMAApeh2VMvwPLjrmYooAI
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const Voice = require('./voice');
var emoji = require('node-emoji');
var Datastore = require('nedb');
var CallbackRouter = require('./callbackRouter');
var rp = require('request-promise');

var ffmpeg = require('fluent-ffmpeg');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
// const sequelize = new Sequelize('Voices', null, null, {
//   dialect: "sqlite",
//   storage: './Voices.sqlite',
//   sync: { force: true },
// });

const sequelize = new Sequelize('mysql://root:root@localhost/kek');

sequelize.authenticate().then(function(err) {
    console.log('Connection has been established successfully.');
  }, function (err) {
    console.log('Unable to connect to the database:', err);
});

var Voices = sequelize.define('Voices', {
  name: Sequelize.STRING,
  path: Sequelize.STRING,
  fileId: Sequelize.STRING,
  chatId: Sequelize.STRING,
  emojiCode: Sequelize.STRING,
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
});

var Users = sequelize.define('Users', {
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

var Collections = sequelize.define('Collections', {
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
  return Voices.create({
    name: 'John',
    path: 'Hancock'
  });
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
    this.emojiDb = Object.assign({}, ...JSON.parse(fs.readFileSync('emojiDbEmpty.json', 'utf8')).map(emoji => {var plh={};plh[emoji]=[];return plh}));

    this.VoicesDb = Voices;
    this.voiceDb = {};

    this.usersDb = Users;

    this.cbr = new CallbackRouter(this);

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
    
    this.cbr.registerFunction('registerIncomingVoice', (chatId, context, [name, emojiCode]) => {
      console.log('rregistering incoming voice ->',chatId,context)
      var {file_id} = context.voiceMsg.voice;
      return this.VoicesDb.findOne({where:{name, emojiCode}}).then(voiceEntry => {
        console.log('voice Sequelize===>', voiceEntry)
        if (!voiceEntry) {
          var voice = new Voice({name, emojiCode, VoicesDB:this.VoicesDb, chatId, fileId: file_id, callback: voice => {
            console.log('--dqdqwdq----->',name,file_id,context,voice, voice.dbEntry)
            this.voiceDb[name] = voice.dbEntry;
            this.emojiDb[emojiCode] = voice.dbEntry;
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

    this.cbr.registerFunction('registerIncomingAudio', (chatId, context, [name, emojiCode]) => {
      console.log('rregistering incoming audio ->',chatId,context)
      var {fileId} = context.voice;
      console.log('plz fileId ->',fileId)
      return this.VoicesDb.findOne({where:{name, emojiCode}}).then(voiceEntryCheck => {
        console.log('voiceEntryCheck===>', voiceEntryCheck)
        if (!voiceEntryCheck) {
          console.log('voice=>', context.voice)
          context.voice.update({fileId,name, emojiCode}).then(m => {console.log('updated', m)});
          this.voiceDb[name] = context.voice;
          this.emojiDb[emojiCode] = context.voice;
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
      // , (err, voices) => {
      //   console.log('voices===>', voices)
      //   if (!voices.length) {
      //     this.VoicesDb.find({fileId}, (err, [voice]) => {
      //       //this.VoicesDb.find({fileId:}, (err, voices) => {console.log(voices)})
      //       if (voice) {
      //         console.log('voice=>', voice)
      //         this.VoicesDb.update({fileId}, {name, emojiCode}, {}, (err,m) => {console.log('updated', m , err)})
      //         this.voiceDb[name] = voice;
      //         this.emojiDb[emojiCode] = voice;
      //         this.bot.sendMessage(chatId, 'Audio Added')
      //       } else {
      //         this.bot.sendMessage(chatId, 'What the Heck')
              
      //       }
            
      //     })
      //   } else {
      //     voice.sendMessage(chatId, 'Voice With this name Exists, please supply again')
      //     return [1, 0]
      //     //this.cbr.subscribe(chatId, 'registerIncomingAudio', context)
      //   }
      // })

      //var voice = new Voice({name, emojiCode, VoicesDB:this.VoicesDb, chatId, fileId: file_id});
      // this.createVoice(chatId, `audios/${audio.audio.file_id}.opus`, name, emojiId, l
      
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
    
      console.log(`message: ${resp}, ${emoji.which(resp)}`);
    
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
 
    });

    this.bot.onText(/^([^/].+) (.+)\)$/, (msg, match) => {
      const chatId = msg.chat.id;
      console.log('chatId===>', chatId)
      
      if (!this.cbr.execute(chatId, [match[1], match[2]])) {
        console.log('registered -->', match);
      } else {
        this.bot.sendMessage(chatId, 'wtf?');
      }

      
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
                this.bot.sendVoice(chatId, voice.fileId, {caption: 'Please supply name and emoji'})
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
              userFavs.push(fileId)
              console.log('userFavs start--',userFavs)
              user.update({fav:JSON.stringify(userFavs)});
              console.log('update done--')
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
          this.bot.sendMessage(chatId, 'Voice received, please supply name and emoji');
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
                title: voice.name + voice.emojiCode
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
                    title: voice.name + voice.emojiCode
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
                    title: this.voiceDb[key].name + ' ' + this.voiceDb[key].emojiCode
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