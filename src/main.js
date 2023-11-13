import './ws'

let candidate = []
let peer

window.onload = () => {
    let localVideoElement = document.querySelector("#localVideo")
    let remoteVideoElement = document.querySelector("#remoteVideo")
    let callButton = document.querySelector("#callButton");
    const ws = new WSS("ws://127.0.0.1:1007")
    ws.init().then(() => {
        ws.subscribe("connect", async (data) => {
            const sessionId = data.data;
            console.log("connect", data.data)
            document.querySelector('#mySessionId').value = sessionId
            peer = new RTCPeerConnection({
                // 可以传入多个stun服务器或者turn服务器 
                iceServers: [ 
                    { urls: 'stun:stun.l.google.com:19302' }, 
                    { url: 'stun:stun1.l.google.com:19302' }, 
                    { url: 'stun:stun2.l.google.com:19302' }, 
                    { url: 'stun:stun3.l.google.com:19302' }, 
                    { url: 'stun:stun4.l.google.com:19302' } 
                ] 
            })
            peer.addEventListener('icecandidate', event => {
                event.candidate && console.log('icecandidate', event)
                if (event.candidate) {
                    candidate.push({
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    })
                }
                if (candidate.length === 1) {
                    ws.send({
                        type: "candidate",
                        data: {
                            candidate: candidate[0],
                            sessionId: document.querySelector('#targetSessionId').value || "A", // 为了方便，这里写死
                        },
                    });
                }
                console.log('呼叫者的信息：', { candidate })
            })
            peer.ontrack = (event) => {
                remoteVideoElement.srcObject = event.streams[0];
            };
        });
        ws.send({
            type: "connect",
        })
    
        // 获取本地音视频数据并将其添加到 peer 中
        navigator.mediaDevices
            .getUserMedia({ audio: true, video: true })
            .then((stream) => {
                // 将音视频设置到页面上
                localVideoElement.srcObject = stream;
                // 将音视频添加到 peer 中
                stream.getTracks().forEach((track) => peer.addTrack(track, stream));
            });
    
        // 发起端点击call时创建offer并发送给接收端
        callButton.onclick = () => {
            peer.createOffer().then(async (offer) => {
                await peer.setLocalDescription(offer);
    
                ws.send({
                    type: "call",
                    data: {
                        srcId: document.querySelector('#mySessionId').value,
                        sessionId: document.querySelector('#targetSessionId').value || "B", // 为了方便，这里写死
                        sdp: offer.sdp,
                    },
                });
            });
        };
    
        // 发起端收到answer sdp
        ws.subscribe("answer", async (data) => {
            const sdp = data.data;
            console.log("get answer", data.data)
            await peer.setRemoteDescription({
                type: "answer",
                sdp,
            });
        });
    
        // 接收端收到 offer sdp
        ws.subscribe("call", async (data) => {
            const sdp = data.data;
            if (!document.querySelector('#targetSessionId').value) {
                document.querySelector('#targetSessionId').value = data.srcId
            }
            console.log("get offer", data.data)
            await peer.setRemoteDescription({
                type: "offer",
                sdp,
            });
    
            // 接收端创建answer并发送给发起端
            peer.createAnswer().then(async (answer) => {
                await peer.setLocalDescription(answer);
                console.log('create answer')
                console.log(answer.sdp)
                ws.send({
                    type: "answer",
                    data: {
                        sdp: answer.sdp,
                        sessionId: document.querySelector('#targetSessionId').value || "A", // 为了方便，这里写死
                    },
                });
            });
        });
    
        // 接收方收到 网络信息
        ws.subscribe("candidate", async (data) => {
            console.log("addIceCandidate", data.data)
            peer.addIceCandidate(new RTCIceCandidate(data.data))
        })
    
        // peer.addEventListener('addstream',(event) => {
        //     remoteVideoElement.srcObject = event.stream;
        // })
    })
}
