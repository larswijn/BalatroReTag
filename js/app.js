let userUpload = document.getElementById("saveFile");
let fileOutput = document.getElementById("fileOutput");
let saveFile = "";
let saveFileParsed;

function isNumeric(num){
  // whether string looks like an int
  return !isNaN(num)
}

function isSaveFileBugged() {
  // simple checks to see whether saveFileParsed shows signs of being bugged
  try {
    const state = saveFileParsed.STATE || 7;
    // 9: tarot pack
    // 10: planet pack
    // 15: spectral pack
    // 17: standard pack
    // 18: buffoon pack
    return [9, 10, 15, 17, 18].includes(state);
  } catch (error) {
    console.log("JSON error in isSaveFileBugged")
    updateIsBugged("JSON error!")
    console.log(error)
    return false;
  }
}

function fixSaveFile() {
  // fix both saveFile and saveFileParsed
  const packs = {9: "tag_charm", 10: "tag_meteor", 15: "tag_ethereal", 17: "tag_standard", 18: "tag_buffoon"};
  const oldState = saveFileParsed.STATE;
  saveFileParsed.STATE = 7;
  const tagKey = (Object.keys(saveFileParsed.tags).length + 1).toString();
  saveFileParsed.tags[tagKey] = {
      "ability": {"orbital_hand": "[poker hand]"},
      "key": packs[oldState],
      "tally": 1 /* weird default - I don't think we can retroactively know what tally we're on? */
  };
  saveFileParsed.GAME.tags[tagKey] = "\"MANUAL_REPLACE\"";
  saveFile = unjsonifyParsedSaveFile(saveFileParsed);
}

function jsonifySaveFile(text) {
  // parse saveFile string to JSON object
  text = text.replace("return ", "");
  text = text.replaceAll(/\[(".*?"|\d+)\]=/g, "$1: ");
  text = text.replaceAll(",}", "}");
  text = text.replaceAll(/(\d+):/g, '"$1":');
  return JSON.parse(text);
}

function unjsonifyParsedSaveFile(parsedSaveFile) {
  // inverse of jsonifySaveFile
  parsedSaveFile = structuredClone(parsedSaveFile);
  for (let key in parsedSaveFile.GAME.cards_played) {
    let backup = parsedSaveFile.GAME.cards_played[key];
    delete parsedSaveFile.GAME.cards_played[key];
    if (isNumeric(key)) {
      parsedSaveFile.GAME.cards_played["'" + key + "'"] = backup;
    } else {
      parsedSaveFile.GAME.cards_played[key] = backup;
    }
  }
  let text = JSON.stringify(parsedSaveFile);
  text = text.replaceAll(/"(\d+)":/g, '[$1]=');
  text = text.replaceAll(/"'(\d+)'":/g, '["$1"]=');
  text = text.replaceAll(/("[^"]*?"):/g, '[$1]=');
  // text = text.replaceAll("}", ",}");
  text = "return " + text;
  return text;
}

function updateIsBugged(custom_html) {
  // update text in HTML
  let isBugged = document.getElementById("isBugged");
  if (custom_html) {
    isBugged.innerHTML = custom_html;
  } else {
    if (isSaveFileBugged()) {
      isBugged.innerHTML = "<span style='color: red; font-size: larger;'>✗</span> Save is broken!";
      document.getElementById("fixFile").disabled = false;
    } else {
      isBugged.innerHTML = "<span style='color: green; font-size: larger;'>✓</span> Save seems good!";
      document.getElementById("fixFile").disabled = true;
    }
  }
}

async function readFile() {
  // read the file, check if it is bugged using `updateIsBugged`
  if (userUpload.files[0].name !== "save.jkr") {
    updateIsBugged("Incorrect file! <a href='https://www.pcgamingwiki.com/wiki/Balatro#Save_game_data_location'>Where to find save.jkr</a>.");
    return;
  }
  saveFile = "";
  const decompressedStream = userUpload.files[0].stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = decompressedStream.getReader();
  while (true) {
    const {done, value} = await reader.read();
    if (done) {
      break;
    }
    const output = new TextDecoder().decode(value);
    saveFile += output;
  }

  saveFileParsed = jsonifySaveFile(saveFile);
  fileOutput.value = JSON.stringify(saveFileParsed, null, 4);
  updateIsBugged();
}

function fixAndDownloadFile() {
  // try fixing file and give progress report, then download if successful
  if (isSaveFileBugged()) {
    fixSaveFile();
    fileOutput.value = JSON.stringify(saveFileParsed, null, 4);
    if (!isSaveFileBugged()) {
      updateIsBugged("Fixed file successfully, preparing download...");
      downloadSaveFile().then();
      updateIsBugged("Downloaded! Please replace old save.jkr with the newly downloaded version.");
    } else {
      updateIsBugged("Error while fixing file! Please contact website administrator.");
    }
  }
}

async function downloadSaveFile() {
  // download saveFile in .jkr format (deflate-raw compression)
  const stringStream = new ReadableStream({
    start(controller) { // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultController
      controller.enqueue(saveFile);
      controller.close();
    },
  });
  const byteStream = stringStream.pipeThrough(new TextEncoderStream());
  const compressedStream = byteStream.pipeThrough(new CompressionStream("deflate-raw"));

  const writerBlob = await new Response(compressedStream).blob();
  const outputBlob = new Blob([writerBlob], {type: 'application/octet-stream'});
  const url = URL.createObjectURL(outputBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = userUpload.files[0].name;
  a.click();
  a.remove();
  window.URL.revokeObjectURL(outputBlob);
}
