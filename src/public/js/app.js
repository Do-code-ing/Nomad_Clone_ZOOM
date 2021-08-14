const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => { // 서버가 작동했을 때
    console.log("Connected to Server ✅");
})

socket.addEventListener("message", (message) => { // 서버로부터 메세지 받기
    console.log("New message: ", message.data);
});

socket.addEventListener("close", () => { // 서버가 닫혔을 때
    console.log("Disconnected from Server ❌")
})

setTimeout(() => { // 10초 뒤에 서버에게 메세지 보내기
    socket.send("hello from the browser.");
}, 1000);