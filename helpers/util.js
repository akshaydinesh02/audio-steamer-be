const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const audioconcat = require("audioconcat");

const parentDir = path.join(__dirname, "..");
const dirName = path.join(parentDir, "songs");

function concatAudioFiles(audioFiles) {
  const audioFilesPath = path.join(parentDir, "songs");
  audioFiles.forEach((file, index) => {
    const newPath = path.join(audioFilesPath, file);
    audioFiles[index] = newPath;
  });

  const outputFilePath = path.join(parentDir, "output", `${Date.now()}.mp3`);
  audioconcat(audioFiles)
    .concat(outputFilePath)
    .on("end", () => {
      console.log("Merging complete!");
    })
    .on("error", (err) => {
      console.error("Error:", err);
    })
    .on("start", () => {
      console.log("Merging started");
    });

  // const concatInstance = ffmpeg();

  // audioFiles.forEach((file) => {
  //   concatInstance.input(path.join(dirName, file));
  // });

  // concatInstance
  //   .output(outputFilePath)
  //   .on("end", () => {
  //     console.log("Merging complete!");
  //   })
  //   .on("error", (err) => {
  //     console.error("Error:", err);
  //   })
  //   .on("start", () => {
  //     console.log("Merging started");
  //   })
  //   .mergeToFile(outputFilePath);
}

module.exports = concatAudioFiles;
