class CallbackRouter {
    constructor(main) {
        this.callbackDb = {};
        this.callbackFunctions = {};
        this.prop = 'lol';
        this.bot = main.bot;
    }

    subscribe(chatId, functionName, context) {
        console.log('starting subsription')
        if (!this.callbackDb[chatId]) {
            console.log('subsriptions didnt exist')
            this.callbackDb[chatId] = [functionName, context];
        } else {
            console.log('subsriptions existed')
            this.callbackDb[chatId] = [functionName, context];
        }
        console.log('subsriptions created')        
    }

    async execute(chatId, data) {
        console.log('----------------',chatId,data,this.callbackDb, '----------------------')
        console.log('1',chatId,data,this.callbackDb[chatId])
        var [functionName,context] = this.callbackDb[chatId];
        console.log('2',functionName,context)
        if (!functionName) return 0
        console.log('3')
        var response = await this.callbackFunctions[functionName](chatId, context, data)
        console.log('response:--->', response)
        if (response[0]) {
            console.log('Executing, response exists',  this.callbackDb, functionName, response[0])
            this.callbackDb[chatId] = [functionName, response[0]];
            return response[1]
        }
        console.log('Executing, response doesnt exist',  this.callbackDb, functionName, response[0])
        
        this.callbackDb[chatId] = [];
        console.log('4')
        return response[1]
    }

    cancel(chatId) {
        console.log('Cancel -> ',chatId)
        this.callbackDb[chatId] = [];
        return true
    }

    registerFunction(functionName, func){
        this.callbackFunctions[functionName] = func.bind(this); //if want to work with inside of router use anonimous function definition, otherwise arrow
    }
}

module.exports = CallbackRouter;