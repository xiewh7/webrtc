window.WSS = class WSS {
    constructor(...arg) {
        this.connection = new WebSocket(arg)
        this.initPromise = new Promise(res => {
            this.connection.onopen = () => {
                console.log('websocket 连接建立')
                res(true)
            }
        })
        this.eventMap = {}
        this.connection.onmessage = (msg) => {
            console.log('WebSocket msg')
            console.log(msg)
            const msgObj = JSON.parse(msg.data || '')
            if (msgObj && msgObj.type && this.eventMap[msgObj.type] && this.eventMap[msgObj.type].length) {
                this.eventMap[msgObj.type].forEach(cb => {
                    cb(msgObj)
                })
            }
        }
    }
    init () {
        return this.initPromise
    }
    send (msg) {
        this.connection.send(JSON.stringify(msg))
    }
    subscribe (event, cb) {
        if (this.eventMap[event]) {
            this.eventMap[event].push(cb)
        } else {
            this.eventMap[event] = [cb]
        }
    }
}