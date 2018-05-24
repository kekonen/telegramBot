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

    back(chatId, {amount, switchKey, last}) {
        console.log('inp', amount, this.callbackHistoryDb[chatId].length) 
        var data = '{"index":"error"}';
        if (!(this.callbackHistoryDb[chatId].length > 1)) return []
        if (switchKey){
            switch (switchKey) {
                case 'lastNormal':
                    var wrongFunctions = ['song','deleteFav','addFav']

                    for(var i = this.callbackHistoryDb[chatId].length -1; i>=0;i--){
                        var potData = JSON.parse(this.callbackHistoryDb[chatId][i]);
                        if (wrongFunctions.indexOf(potData.index) == -1){
                            data = JSON.stringify(potData)
                            break;
                        }
                    }

                    break;
                case 'last':
                    for(var i = this.callbackHistoryDb[chatId].length -1; i>=0;i--){
                        var potData = JSON.parse(this.callbackHistoryDb[chatId][i]);
                        if (potData.index == last){
                            data = JSON.stringify(potData)
                            break;
                        }
                    }

                    break;
            }
        } else {
            var place = this.callbackHistoryDb[chatId].length - 2 + (amount?amount:0);
        
            data = this.callbackHistoryDb[chatId][place];
            console.log('place', place, data, this.callbackHistoryDb)
        }
        
        return [{
            text: "Back",
            callback_data: data
          }]
    }

}

module.exports = CallbackHistoryDb;