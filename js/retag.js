import {jsonifySaveFile, unjsonifyParsedSaveFile, readFile, downloadSaveFile} from "./app.js";

let fileOutput = document.getElementById("fileOutput");
let saveFile = "";
let saveFileParsed;

function isSaveFileBugged() {
  // simple checks to see whether saveFileParsed shows signs of being bugged
  try {
    const state = saveFileParsed.STATE || 7;
    // this part is for the double tag booster pack reload bug:
    //   9: tarot pack
    //   10: planet pack
    //   15: spectral pack
    //   17: standard pack
    //   18: buffoon pack
    if ([9, 10, 15, 17, 18].includes(state)) {
      return true;
    }
    // this part is for the shop / booster pack overlay:
    //   5: in shop
    //   sanity check to confirm we are in the shop: `ACTION` key in main dict
    if (state === 5 && saveFileParsed.hasOwnProperty("ACTION")) {
      return true;
    }
    // this part is for the softlock after skipping a bugged booster pack:
    //    6: PLAY_TAROT
    //    sanity check to confirm we are in the shop: `shop_booster` or `shop_jokers` keys exist
    if (state === 6 && saveFileParsed.hasOwnProperty("cardAreas") &&
      (saveFileParsed.cardAreas.hasOwnProperty("shop_booster") || saveFileParsed.cardAreas.hasOwnProperty("shop_jokers"))) {
      return true;
    }
    //
    return false;
  } catch (error) {
    console.log("JSON error in isSaveFileBugged")
    updateIsBugged("JSON error!")
    console.log(error)
    return false;
  }
}

function fixSaveFile() {
  // fix both saveFile and saveFileParsed
  try {
    const oldState = saveFileParsed.STATE;
    if ([9, 10, 15, 17, 18].includes(oldState)) {
      const packs = {9: "tag_charm", 10: "tag_meteor", 15: "tag_ethereal", 17: "tag_standard", 18: "tag_buffoon"};
      saveFileParsed.STATE = 7;
      const tagKey = (Object.keys(saveFileParsed.tags).length + 1).toString();
      saveFileParsed.tags[tagKey] = {
        "ability": {"orbital_hand": "[poker hand]"},
        "key": packs[oldState],
        "tally": 1 /* weird default - I don't think we can retroactively know what tally we're on? */
      };
      saveFileParsed.GAME.tags[tagKey] = "\"MANUAL_REPLACE\"";
    } else if (oldState === 5 && saveFileParsed.hasOwnProperty("ACTION")) {
      delete saveFileParsed["ACTION"];
    } else if (oldState === 6) {
      saveFileParsed.STATE = 5
    } else {
      console.log("How tf did you get here?");
    }
    saveFile = unjsonifyParsedSaveFile(saveFileParsed);
  } catch (error) {
    console.log("JSON error in isSaveFileBugged")
    updateIsBugged("JSON error!")
    console.log(error)
    return false;
  }
}

function updateIsBugged(custom_html) {
  // update "isBugged" text in HTML
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

async function handleFile() {
  // handle the read the file, and update corresponding elements
  let userUpload = document.getElementById("saveFile");
  if (userUpload.files[0].name.includes("save") && userUpload.files[0].name.endsWith(".jkr")) {
    saveFile = await readFile(userUpload);
    try {
      saveFileParsed = jsonifySaveFile(saveFile);
      fileOutput.value = JSON.stringify(saveFileParsed, null, 4);
      updateIsBugged();
    } catch (error) {
      console.log("JSON error in isSaveFileBugged")
      updateIsBugged("Error reading file! Is this modded?")
      console.log(error)
      return false;
    }
  } else {
    let href = `<a href='https://www.pcgamingwiki.com/wiki/Balatro#Save_game_data_location'>Where to find save.jkr</a>`
    fileOutput.value = "";
    updateIsBugged(`Incorrectly named file '${userUpload.files[0].name}'! Use 'save.jkr' instead. ${href}.`);
    document.getElementById("fixFile").disabled = true;
  }
}

function fixAndDownloadFile() {
  // try fixing file and give progress report, then download if successful
  if (isSaveFileBugged()) {
    fixSaveFile();
    fileOutput.value = JSON.stringify(saveFileParsed, null, 4);
    if (!isSaveFileBugged()) {
      updateIsBugged("Fixed file successfully, preparing download...");
      downloadSaveFile(saveFile,"save.jkr").then();
      updateIsBugged("Downloaded! Please replace old save.jkr with the newly downloaded version.");
    } else {
      updateIsBugged("Error while fixing file! Please contact website administrator.");
    }
  }
}

document.getElementById("saveFile").addEventListener("change", handleFile);
document.getElementById("fixFile").addEventListener("click", fixAndDownloadFile);
