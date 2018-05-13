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
            this.callbackDb[chatId] = [[functionName, context]];
        } else {
            console.log('subsriptions existed')
            this.callbackDb[chatId].push([functionName, context]);
        }
        console.log('subsriptions created')        
    }

    execute(chatId, data) {
        console.log('1',chatId,data,this.callbackDb[chatId])
        var [functionName,context] = this.callbackDb[chatId].pop();
        console.log('2',functionName,context)
        if (!functionName) return 0
        console.log('3')
        return this.callbackFunctions[functionName](chatId, context, data)
        console.log('4')
    }

    registerFunction(functionName, func){
        this.callbackFunctions[functionName] = func.bind(this); //if want to work with inside of router use anonimous function definition, otherwise arrow
    }
}

module.exports = CallbackRouter;