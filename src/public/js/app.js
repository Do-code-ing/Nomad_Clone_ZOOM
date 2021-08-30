const socket = io();

const myFace = document.getElementById("myFace");
const myVoice = document.getElementById("myVoice");
const peerFace = document.getElementById("peerFace");
const peerVoice = document.getElementById("peerVoice");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const room = document.getElementById("room");
const title = document.getElementById("title");
const call = document.getElementById("call");
const state = document.getElementById("state");
const notice = document.getElementById("notice");
const noom = "Noom";

room.style.display = "none";
notice.hidden = true;

let myAudio;
let myVideo;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCamera() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myVideo.getVideoTracks()[0];
        cameras.forEach((camera) =>{
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

async function getVideo(deviceId) {
    const initialVideo = {
        video: { facingMode: "user" },
    };
    const constrainVideo = {
        video: { deviceId: { exact: deviceId } },
    };
    try {
        myVideo = await navigator.mediaDevices.getUserMedia(
            deviceId ? constrainVideo : initialVideo
        );
        myFace.srcObject = myVideo;
        await getCamera();
    } catch (e) {
        console.log(e);
        myFace.style.backgroundImage = "url(public/img/unknown.png)";
        myFace.style.backgroundSize = "cover";
        cameraBtn.hidden = true;
        camerasSelect.hidden = true;
    }
}

async function getAudio(deviceId) {
    const initailAudio = {
        audio: true,
    };
    try {
        myAudio = await navigator.mediaDevices.getUserMedia(initailAudio);
        myVoice.srcObject = myAudio;
    } catch (e) {
        console.log(e);
        muteBtn.hidden = true;
    }
}

function handleMuteClick() {
    if (myAudio) {
        myAudio
            .getAudioTracks()
            .forEach((track) => (track.enabled = !track.enabled));
        if (!muted) {
            muteBtn.innerText = "Unmute";
            muted = true;
        } else {
            muteBtn.innerText = "Mute";
            muted = false;
        }
    }
}

function handleCameraClick() {
    if (myVideo) {
        myVideo
            .getVideoTracks()
            .forEach((track) => (track.enabled = !track.enabled));
        if (cameraOff) {
            cameraBtn.innerText = "Turn Camera Off";
            cameraOff = false;
        } else {
            cameraBtn.innerText = "Turn Camera On";
            cameraOff = true;
        }
    }
}

async function handleCameraChange() {
    await getVideo(camerasSelect.value);
    if (myPeerConnection) {
        const videoTrack = myVideo.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome From (join the room)

const main = document.getElementById("main");
const welcome = document.getElementById("welcome");
const welcomeForm = document.getElementById("room-name");

async function initCall() {
    main.hidden = true;
    room.style.display = "flex";
    await getVideo();
    await getAudio();
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    if (main.hidden === true) {
        title.innerText = `  Noom: ${roomName}  `;
    }
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

socket.on("welcome", async () => {
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", handlePeerChat);
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", handlePeerChat);
    });
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});

socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    console.log("received candidate")
    myPeerConnection.addIceCandidate(ice);
    state.innerText = "🟢 Connected";
    if (!peerFace.srcObject) {
        peerFace.style.backgroundImage = "url(public/img/unknown.png)";
        peerFace.style.backgroundSize = "contain";
    }
});

socket.on("exit_room", handlePeerExitRoom);

socket.on("peer_disconnecting", handlePeerExitRoom);

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ]
            }
        ],
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("track", handleAddTrack);
    if (myVideo) {
        myVideo
            .getVideoTracks()
            .forEach((track) => myPeerConnection.addTrack(track, myVideo));
    }
    if (myAudio) {
        myAudio
            .getAudioTracks()
            .forEach((track) => myPeerConnection.addTrack(track, myAudio));
    }
}

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
    state.innerText = "🟢 Connected";
}

async function handleAddTrack(data) {
    if (data.track.kind === "video") {
        peerFace.srcObject = await data.streams[0];
    } else {
        peerVoice.srcObject = await data.streams[0];
    }
}

// chat & room exit

const chat = document.getElementById("chat");
const chatForm = document.getElementById("chat-form");
const chatInput = chatForm.querySelector("#chat-input");
const exitForm = document.getElementById("exit-form")
const exitRoomBtn = exitForm.querySelector("#exit-room-button");

function handleMyChat(event) {
    event.preventDefault();
    const div = document.createElement("div");
    const p = document.createElement("p");
    const value = chatInput.value;
    div.className = "my-div";
    p.className = "my-chat";
    p.innerText = value;

    if (myPeerConnection.iceConnectionState === "connected") {
        myDataChannel.send(value);
    }
    
    div.append(p);
    chat.append(div);
    chatInput.value = "";
    chat.scrollTop = chat.scrollHeight;
}

function handlePeerChat(event) {
    const div = document.createElement("div");
    const p = document.createElement("p");
    const value = event.data;
    div.className = "peer-div";
    p.className = "peer-chat";
    p.innerText = value;
    div.append(p);
    chat.append(div);
    chat.scrollTop = chat.scrollHeight;
}

function handleExitRoom() {
    title.innerText = "";
    state.innerText = "🟠 Waiting";
    main.hidden = false;
    room.style.display = "none";
    muteBtn.innerText = "Mute";
    muted = false;
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
    if (myVideo) {
        myVideo
            .getVideoTracks()
            .forEach((track) => (track.enabled = false));
    }
    if (myAudio) {
        myAudio
            .getAudioTracks()
            .forEach((track) => (track.enabled = false));
    }
    socket.emit("exit_room", roomName);
    peerFace.srcObject = null;
    peerVoice.srcObject = null;
    while (chat.childNodes.length) {
        chat.removeChild(chat.childNodes[0]);
    }
}

function handleMyExitRoom(event) {
    event.preventDefault();
    handleExitRoom();
    notice.classList.remove("disappear");
    notice.hidden = false;
    notice.innerText = "방에서 나왔습니다.";
    disapper();
    setTimeout((() => notice.hidden = true), 3000);
}

function handlePeerExitRoom() {
    handleExitRoom();
    notice.classList.remove("disappear");
    notice.hidden = false;
    notice.innerText = "상대방이 방을 나갔습니다.";
    disapper();
    setTimeout((() => notice.hidden = true), 3000);
}

function disapper() {
    setTimeout(() => {
        notice.classList.add("disappear");
    }, 2000);
}

chatForm.addEventListener("submit", handleMyChat);
exitForm.addEventListener("submit", handleMyExitRoom);