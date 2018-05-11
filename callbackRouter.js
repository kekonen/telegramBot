class CallbackRouter {
    constructor(main) {
        this.callbackDb = {};
        this.callbackFunctions = {};
        this.prop = 'lol';
        this.bot = main.bot;
    }

    subscribe(chatId, functionName) {
        console.log('starting subsription')
        if (!this.callbackDb[chatId]) {
            console.log('subsriptions didnt exist')
            this.callbackDb[chatId] = [functionName];
        } else {
            console.log('subsriptions existed')
            this.callbackDb[chatId].push(functionName);
        }
        console.log('subsriptions created')        
    }

    execute(chatId, data) {
        console.log('1',chatId,data)
        var functionName = this.callbackDb[chatId].pop();
        console.log('2',functionName)
        if (!functionName) return 0
        console.log('3')
        this.callbackFunctions[functionName](chatId, data)
        console.log('4')
    }

    registerFunction(functionName, func){
        this.callbackFunctions[functionName] = func.bind(this);
        
    }
}

module.exports = CallbackRouter;