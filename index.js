const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const musicMetadata = require("music-metadata");

const concatAudioFiles = require("./helpers/util");

const parseFile = musicMetadata.parseFile;

let currentTimeStamp = 0;
let currentPlayingAudio = "";

function startServer() {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

function getAudioFiles() {
  const mp3Files = fs
    .readdirSync(dirName)
    .filter((file) => file.endsWith(".mp3"));

  let i = 0;
  let contentLength = 0;

  mp3Files.forEach((file) => {
    const fileName = path.join(dirName, file);
    contentLength += fs.statSync(fileName).size;
  });

  return { mp3Files, contentLength };
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

function startSequentialTimer(audioDurations) {
  const audios = Array.from(audioDurations.entries());
  let currentAudioIndex = 0;

  const playNextAudio = () => {
    if (currentAudioIndex >= audios.length) {
      // Condition for looping
      currentAudioIndex = 0;
    }

    const [audio, duration] = audios[currentAudioIndex];

    console.log(`Playing ${audio} for ${duration} seconds`);

    currentTimeStamp = 0;
    currentPlayingAudio = audio;

    const intervalId = setInterval(() => {
      currentTimeStamp++;
      console.log("Current", currentTimeStamp);
    }, 1000);

    setTimeout(() => {
      clearInterval(intervalId);
      // console.log("Curr details")
      currentAudioIndex++;
      playNextAudio();
    }, duration * 1000);
  };

  playNextAudio();
}

app.post("/concat", (req, res) => {
  const { mp3Files, contentLength } = getAudioFiles();
  concatAudioFiles(mp3Files);
});

app.post("/startStream", async (req, res) => {
  const { mp3Files, contentLength } = getAudioFiles();
  const metaData = await processAudioFiles(mp3Files);
  const testdata = new Map([
    ["marali-mareyagi", 30],
    ["kesariya", 25.1254],
    ["pancharangi haadu", 15.2354],
    ["udisuve", 20],
    ["olave olave", 28.5415],
    ["kagadada", 15.745],
    ["belageddu", 22.1471],
    ["usire", 26.2626],
    ["om shanti om", 22.2541],
    ["ajab si", 23.4741],
  ]);

  // console.log(metaData);
  // console.log(testdata);
  startSequentialTimer(metaData);
  // const firstEl = [...metaData][0];
  // console.log(firstEl);
  // for (const audio of metaData) {
  //   const name = audio[0];
  //   const duration = audio[1];
  //   // console.log("name", name);
  //   // console.log("duration", duration);
  //   const timer = setTimeout(() => {
  //     console.log("Test");
  //   }, duration);
  // }
});

app.get("/getCurrentAudioDetails", (req, res) => {
  res.json({ currentTimeStamp, currentPlayingAudio });
});

app.get("/getAudioFile", (req, res) => {
  function sendAudioFile() {
    // const mp3Files = getAudioFiles();
    const { mp3Files, contentLength } = getAudioFiles();
    // console.log(mp3Files);

    const mp3File = path.join(dirName, currentPlayingAudio);
    const fileStream = fs.createReadStream(mp3File);
    fileStream
      .on("data", (chunk) => {
        res.write(chunk);
      })
      .on("error", (error) => {
        console.error("Error while streaming", error);
      })
      .on("end", () => {
        res.end();
      });
  }
  sendAudioFile();
});

app.get("/stream", (req, res) => {
  const { mp3Files, contentLength } = getAudioFiles();
  // console.log(mp3Files);

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Length", contentLength);
  res.set("Transfer-Encoding", "chunked");

  function sendFile() {
    const outputDir = path.join(__dirname, "output");
    const mp3File = path.join(outputDir, "231235213213.mp3");
    console.log(`processing ${mp3File}`);
    const fileStream = fs.createReadStream(mp3File, {
      start: currentTimeStamp,
    });
    fileStream
      .on("data", (chunk) => {
        res.write(chunk);
      })
      .on("end", () => {
        // console.log("ENDED");
        // i++;
        // if (i < mp3Files.length) {
        //   sendFile();
        // } else {
        //   res.end();
        // }
      });
  }
  sendFile();
});

startServer();
