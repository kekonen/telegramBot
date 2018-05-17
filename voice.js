var emoji = require('node-emoji');

var deleteUndefined = (l) => {Object.keys(l).forEach(key => l[key] === undefined && delete l[key]);return l};

class Voice {
	constructor({path, VoicesDB, fileId, chatId, name, emojiCode, callback}) {
		this.path = path; 
		this.name = name;
		this.emojiCode = emojiCode;

		
		this.fileId = fileId;

		this.chatId = chatId;

		if (VoicesDB) {
			this.VoicesDB = VoicesDB

			this.VoicesDB.findOne({where: this.getVoiceData()}).then(voice => {
				if (voice) {
					
					this.dbEntry = voice;
					console.log('lllllllllllllllllllll0000llllll',this.dbEntry,voice, this )
					if (callback) callback(this)
				} else {
					this.VoicesDB.create(this.getVoiceData()).then(voice => {this.dbEntry = voice;
						console.log('lllllllllllllllllllll0000llllll',this.dbEntry,voice, this )
						if (callback) callback(this)
					})

					
				}
			})
		}



		//this.syncDb({})
		console.log(`path:${path}, name:${name}, emojiCode:${emojiCode}, {VoicesDB:${VoicesDB}, fileId:${fileId}, chatId:${chatId}}`)
	}

	tetherDb(VoicesDB) {
		if (VoicesDB) {
			this.VoicesDB = VoicesDB

			this.VoicesDB.findOne({where: this.getVoiceData()}).then(voice => {
				if (voice) {
					this.dbEntry = voice;
				} else {
					this.VoicesDB.create(this.getVoiceData()).then(voice => this.dbEntry = voice)
				}
			})
		}

		// VoicesDB.find({$or: [{ fileId: this.fileId }, { name: this.name, emojiCode:this.emojiCode }]}, (err, results) => {
		// 	console.log('addVoicesDb===>', results)
		// 	if (results.length) {
		// 		VoicesDB.update({$or: [{ fileId: this.fileId }, { name: this.name, emojiCode:this.emojiCode }]},this.getVoiceData())
		// 	} else {
		// 		VoicesDB.insert(this.getVoiceData())
		// 	}
		// })
	}


	refresh() {
		return this.dbEntry.update(this.getVoiceData())
	}

	update(toSet) {
		Object.keys(toSet).forEach(key => {
			this[key] = toSet[key];
		})
		return this.dbEntry.update(toSet)
	}

	setFileId(fileId) {
		this.fileId = fileId;
		if (this.VoicesDB) {
			this.VoicesDB.update({name: this.name, emojiCode: this.emojiCode}, {fileId})
		} else {
			console.log('VOiceDB used but not good')
		}
		
		return this
	}

	set(toSet){
		console.log('setting===> ', toSet)
		Object.keys(toSet).forEach(key => {
			this[key] = toSet[key];
		})
	}

	getVoiceData(){
		console.log('getVoiceData=>', {path:this.path, name:this.name, emojiCode:this.emojiCode, fileId:this.fileId, chatId:this.chatId})
		// var returnObj = deleteUndefined({path:this.path, name:this.name, emojiCode:this.emojiCode, fileId:this.fileId, chatId:this.chatId});
		return deleteUndefined({path:this.path, name:this.name, emojiCode:this.emojiCode, fileId:this.fileId, chatId:this.chatId});
	}

	getVoiceForSend(id){
		console.log('this vocie==>', this)
		if (id) {return {
			type:'voice',
            id,
            voice_file_id: this.fileId,
            title: this.name + ' ' + this.emojiCode,
            caption: emoji.emojify(this.emojiCode)
		}}
		return {
			type:'voice',
            id:'1',
            voice_file_id: this.fileId,
            title: this.name + ' ' + this.emojiCode,
            caption: emoji.emojify(this.emojiCode)
		}
	}

}

module.exports = Voice;