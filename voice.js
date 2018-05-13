var emoji = require('node-emoji');

class Voice {
	constructor(path, name, emojiCode, {VoicesDB, fileId, chatId}) {
		this.path = path; 
		this.name = name;
		this.emojiCode = emojiCode;

		this.VoicesDB = VoicesDB;
		this.fileId = fileId;

		this.chatId = chatId;
		console.log(`path:${path}, name:${name}, emojiCode:${emojiCode}, {VoicesDB:${VoicesDB}, fileId:${fileId}, chatId:${chatId}}`)
	}

	addVoicesDb(VoicesDB) {
		this.VoicesDB = VoicesDB;

		VoicesDB.insert(this.getVoiceData())
	}

	setFileId(fileId) {
		this.fileId = fileId;
		return this
	}

	getVoiceData(){
		console.log('getVoiceData=>', {path:this.path, name:this.name, emojiCode:this.emojiCode, fileId:this.fileId, chatId:this.chatId})
		return {path:this.path, name:this.name, emojiCode:this.emojiCode, fileId:this.fileId, chatId:this.chatId};
	}

	getVoiceForSend(id){
		console.log('this vocie==>', this)
		if (id) {return {
			type:'voice',
            id,
            voice_file_id: this.fileId,
            title: this.name + this.emojiCode,
            caption: emoji.emojify(this.emojiCode)
		}}
		return {
			type:'voice',
            id:'1',
            voice_file_id: this.fileId,
            title: this.name,
            caption: emoji.emojify(this.emojiCode)
		}
	}

}

module.exports = Voice;