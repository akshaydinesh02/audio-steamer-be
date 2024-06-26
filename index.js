// import { parseFile } from "music-metadata";

const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const musicMetadata = require("music-metadata");

const parseFile = musicMetadata.parseFile;

function startServer() {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

const dirName = path.join(__dirname, "songs");

async function processAudioFiles(mp3Files) {
  const allMetaData = new Map();
  for (file of mp3Files) {
    const fileNameWithPath = path.join(dirName, file);
    const metadata = await parseFile(fileNameWithPath, {
      duration: true,
      skipCovers: true,
      skipPostHeaders: true,
    });
    const duration = metadata.format.duration;
    allMetaData.set(`${file}`, duration);
  }
  return allMetaData;
}

app.post("/test", async (req, res) => {
  const mp3Files = fs
    .readdirSync(dirName)
    .filter((file) => file.endsWith(".mp3"));

  let i = 0;
  let contentLength = 0;

  mp3Files.forEach((file) => {
    const fileName = path.join(dirName, file);
    contentLength += fs.statSync(fileName).size;
  });
  const metaData = await processAudioFiles(mp3Files);
  console.log("Meta data", metaData);
});

app.get("/stream", (req, res) => {
  const mp3Files = fs
    .readdirSync(dirName)
    .filter((file) => file.endsWith(".mp3"));

  let i = 0;
  let contentLength = 0;

  mp3Files.forEach((file) => {
    const fileName = path.join(dirName, file);
    contentLength += fs.statSync(fileName).size;
  });

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Length", contentLength);
  res.set("Transfer-Encoding", "chunked");

  function sendFile() {
    const mp3File = path.join(dirName, mp3Files[i]);
    console.log(`processing ${mp3File}`);
    const fileStream = fs.createReadStream(mp3File);
    fileStream
      .on("data", (chunk) => {
        res.write(chunk);
      })
      .on("end", () => {
        i++;
        if (i < mp3Files.length) {
          sendFile();
        } else {
          res.end();
        }
      });
  }
  sendFile();
});

startServer();
