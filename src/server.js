import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug"); // view engine 을 pug 로
app.set("views", __dirname + "/views"); // express 의 템플릿이 어디 있는지 정의
app.use("/public", express.static(__dirname + "/public")); // public url을 생성해서 유저가 접근할 수 있게
app.get("/", (_, res) => res.render("home")); // home.pug 를 render 해주는 route handler 만들기
app.get("/*", (_, res) => res.redirect("/")); // 다른 url 사용하게 하기, 지금은 다 home으로 보내기

const handleListen = () => console.log(`Listening on http://localhost:3000`)

const server = http.createServer(app); // http 서버, 접근하기 위해
const wss = new WebSocket.Server({server}); // websockets 서버, http 서버 위에 만들기, 2개의 protocol이 같은 port를 공유

const sockets = []; // fake database, 브라우저와의 연결 저장

wss.on("connection", (socket) => { // 연결되었을 때, on == addEventListener?
    sockets.push(socket)
    socket["nickname"] = "Anon";
    console.log("Connected to Browser ✅");
    socket.on("close", () => console.log("Disconnected from Browser ❌")); // 브라우저와 연결이 끊기면
    socket.on("message", (msg) => {
        const message = JSON.parse(msg);
        switch (message.type) {
            case "new_message":
                sockets.forEach((aSocket) =>
                    aSocket.send(`${socket.nickname}: ${message.payload}`));
                break;
            case "nickname":
                socket["nickname"] = message.payload;
        }
    });
});

server.listen(3000, handleListen);