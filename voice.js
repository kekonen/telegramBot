class Voice {
	constructor(path, name, emojiCode) {
		this.path = path; 
		this.name = name;
		this.emojiCode = emojiCode;
	}

	setFileId(fileId) {
		this.fileId = fileId;
	}
}

module.exports = Voice;