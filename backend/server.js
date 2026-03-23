const express = require("express");
const { spawn } = require("child_process");

const app = express();
app.use(express.json());

// 🔥 이거 추가 (CORS 허용)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.post("/path", (req, res) => {
  const inputJson = JSON.stringify(req.body);

  // C++ 실행 파일 (a.out)
  const process = spawn("./a.out");

  let result = "";
  let error = "";

  process.stdout.on("data", (data) => {
    result += data.toString();
  });

  process.stderr.on("data", (data) => {
    error += data.toString();
  });

  process.on("close", () => {
    if (error) {
      return res.status(500).send(error);
    }

    try {
      const parsed = JSON.parse(result);
      res.json(parsed);
    } catch (e) {
      res.status(500).send("Invalid JSON from C++");
    }
  });

  // 👉 C++로 JSON 전달
  process.stdin.write(inputJson);
  process.stdin.end();
});

app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});