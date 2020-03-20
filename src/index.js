const fs = require("fs");
const { readdir } = require("fs").promises;
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT;
const root = process.env.ROOT;
const bodyParser = require("body-parser");
const { getDirectoryContents } = require("./utils/getDirectoryContents.js");

let contents = new Set();
getDirectoryContents(root).then(c => (contents = new Set(c)));

app.use(function(req, res, next) {
  const ip = req.header("x-forwarded-for"); // because we are behind ngrok proxy
  console.log(
    JSON.stringify({
      time: Date.now(),
      ip,
      method: req.method,
      route: req.originalUrl
    })
  );
  next();
});

app.use(cors());

app.use(bodyParser.json({ limit: "10gb" }));

app.get("/*", async (req, res) => {
  const _root = root.replace(/\/$/, "");
  const _url = req.originalUrl.replace(/^\//, "").replace(/\/$/, "");
  const path = _url ? `${_root}/${_url}` : _root;

  if (!contents.has(path) && req.originalUrl !== "/") {
    return res.send("File doesn't exist");
  }

  const isDirectory = fs.lstatSync(path).isDirectory();

  if (isDirectory) {
    let dirContent = "<div>";
    const files = await readdir(path, { withFileTypes: true });
    files.map(file => {
      if (!file.name.match(/^\./)) {
        const url = _url ? `/${_url}/${file.name}` : `/${file.name}`;
        dirContent += `<a href="${url}">${file.name}</a></br>`;
      }
    });
    dirContent += "</div>";
    res.set("Content-Type", "text/html");
    res.send(new Buffer(dirContent));
  } else {
    res.download(path);
  }
});

app.listen(port, () => console.log(`Listening on port ${port}!`));
