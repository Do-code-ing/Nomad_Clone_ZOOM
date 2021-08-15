const messageList = document.querySelector("ul");
const messageFrom = document.querySelector("#message");
const nickFrom = document.querySelector("#nick");
const socket = new WebSocket(`ws://${window.location.host}`);

function makeMessage(type, payload) {
    const msg = {type, payload};
    return JSON.stringify(msg);
}

socket.addEventListener("open", () => { // 서버가 작동했을 때
    console.log("Connected to Server ✅");
})

socket.addEventListener("message", (message) => { // 서버로부터 메세지 받기
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
});

socket.addEventListener("close", () => { // 서버가 닫혔을 때
    console.log("Disconnected from Server ❌")
});

function handleSubmit(event) {
    event.preventDefault();
    const input = messageFrom.querySelector("input");
    socket.send(makeMessage("new_message", input.value));
    const li = document.createElement("li");
    li.innerText = `You: ${input.value}`
    messageList.append(li);
    input.value = "";
}

function handleNickSubmit(event) {
    event.preventDefault();
    const input = nickFrom.querySelector("input");
    socket.send(makeMessage("nickname", input.value));
    input.value = "";
}

messageFrom.addEventListener("submit", handleSubmit);
nickFrom.addEventListener("submit", handleNickSubmit);