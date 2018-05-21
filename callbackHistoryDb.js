class CallbackHistoryDb {
    constructor() {
        this.callbackHistoryDb = {};
    }

    add(chatId, data) {
        console.log('CallBackHistory Starts ',chatId,data,'----------------------');
        if (!this.callbackHistoryDb[chatId]) this.callbackHistoryDb[chatId] = [];
        this.callbackHistoryDb[chatId].push(data);
        console.log('CallBackHistory added ',chatId,data,'----------------------');
    }

    cleanChat(chatId) {
        this.callbackHistoryDb[chatId] = [];
    }

    cleanAll(){
        this.callbackHistoryDb = {};
    }

    back(chatId) {
        if (!(this.callbackHistoryDb[chatId].length > 1)) return []
        var place = this.callbackHistoryDb[chatId].length - 2;
        var data = this.callbackHistoryDb[chatId][place];
        return [{
            text: "Back",
            callback_data: data
          }]
    }

}

module.exports = CallbackHistoryDb;