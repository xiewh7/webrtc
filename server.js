const WS = require('ws')
const webSocketServer = WS.Server
const wss = new webSocketServer({ port: 1007 })
// console.error(wss)

// 生成唯一ID 
function createId () {
    let e = () =>
        Math.floor((1 + Math.random()) * 65536)
            .toString(16)
            .substring(1)
    return `${e()}${e()}-${e()}-${e()}-${e()}-${e()}${e()}`
}

//  存储连接的客户端 
const people = {}
wss.on("connection", function (ws) {
    // console.error('connection')
    ws.on("message", function (message) {
        message = message.toString()
        message = JSON.parse(message)

        switch (message.type) {
            case "connect":
                console.error('connect')
                // 将连接的客户端存储起来
                const sessionId = createId()
                people[sessionId] = {
                    sessionId,
                    ws,
                }
                ws.send(
                    JSON.stringify({
                        type: "connect",
                        data: sessionId,
                    })
                )
                break
            case "call":
                // 将 sdp 发给接收端，sessionId 为 接收端的 id
                const sdp = message.data.sdp;
                const sId = message.data.sessionId;
                const srcId = message.data.srcId;
                console.error(message.data)
                console.error('call')
                if (people[sId]) {
                    people[sId].ws.send(
                        JSON.stringify({
                            type: "call",
                            data: sdp,
                            srcId,
                        })
                    );
                }
                break;
            case "answer":
                // 接收端将 sdp 发给发起端，sessionId 为 发起端的 id
                const answerSDP = message.data.sdp;
                const recevId = message.data.sessionId;;
                if (people[recevId]) {
                    people[recevId].ws.send(
                        JSON.stringify({
                            type: "answer",
                            data: answerSDP,
                        })
                    )
                }
                break;
            case "getAllClients":
                ws.send(
                    JSON.stringify({
                        type: "getAllClients",
                        data: Object.keys(people),
                    })
                );
                break
            case "candidate":
                // 接收端将 candidate 发给发起端，sessionId 为 发起端的 id
                const candidate = message.data.candidate;
                const recevIdC = message.data.sessionId;
                console.log('candidate')
                if (people[recevIdC]) {
                    people[recevIdC].ws.send(
                        JSON.stringify({
                            type: "candidate",
                            data: candidate,
                        })
                    )
                }
                break;
        }
    })
})