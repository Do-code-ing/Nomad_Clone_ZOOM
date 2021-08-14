import express from "express";

const app = express();

app.set("view engine", "pug"); // view engine 을 pug 로
app.set("views", __dirname + "/views"); // express 의 템플릿이 어디 있는지 정의
app.use("/public", express.static(__dirname + "/public")); // public url을 생성해서 유저가 접근할 수 있게
app.get("/", (req, res) => res.render("home")); // home.pug 를 render 해주는 route handler 만들기
app.get("/*", (req, res) => res.redirect("/")); // 다른 url 사용하게 하기, 지금은 다 home으로 보내기

const handleListen = () => console.log(`Listening on http://localhost:3000`)
app.listen(3000, handleListen);