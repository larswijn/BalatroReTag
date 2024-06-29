function isNumeric(num){
  // whether string looks like an int
  return !isNaN(num)
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

async function readFile(userUpload) {
  // read the file, insert content into `saveFile`, call `updateIsBugged`
  let tempFile = "";
  const decompressedStream = userUpload.files[0].stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = decompressedStream.getReader();
  while (true) {
    const {done, value} = await reader.read();
    if (done) {
      break;
    }
    const output = new TextDecoder().decode(value);
    tempFile += output;
  }
  return tempFile;
}

async function downloadSaveFile(saveFile, name) {
  // download saveFile in .jkr format (deflate-raw compression)
  if (saveFile === undefined || name === undefined) {
    throw new Error("Required parameter was not provided!");
  }
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
  a.download = name;
  a.click();
  a.remove();
  window.URL.revokeObjectURL(outputBlob);
}

export {jsonifySaveFile, unjsonifyParsedSaveFile, readFile, downloadSaveFile};
