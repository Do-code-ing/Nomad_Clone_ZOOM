import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug"); // view engine 을 pug 로
app.set("views", __dirname + "/views"); // express 의 템플릿이 어디 있는지 정의
app.use("/public", express.static(__dirname + "/public")); // public url을 생성해서 유저가 접근할 수 있게
app.get("/", (_, res) => res.render("home")); // home.pug 를 render 해주는 route handler 만들기
app.get("/*", (_, res) => res.redirect("/")); // 다른 url 사용하게 하기, 지금은 다 home으로 보내기

const httpServer = http.createServer(app); // http 서버, 접근하기 위해
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
    socket.on("join_room", (roomName, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome");
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`)
httpServer.listen(3000, handleListen);