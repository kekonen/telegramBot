class Voice {
	constructor(path, name, emojiCode, fileId) {
		this.path = path; 
		this.name = name;
		this.emojiCode = emojiCode;
		this.fileId = fileId;
	}

	setFileId(fileId) {
		this.fileId = fileId;
	}

	getVoiceData(){
		return {type: 'voice', path:this.path, name:this.name, emojiCode:this.emojiCode, fileId:this.fileId};
	}
}

module.exports = Voice;