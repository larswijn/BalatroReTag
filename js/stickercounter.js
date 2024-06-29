import {jsonifySaveFile, readFile} from "./app.js";

let saveFile = "";
let saveFileParsed;

function updateNotice(custom_html) {
  // update "noticeParagraph" text in HTML
  let noticeParagraph = document.getElementById("noticeParagraph");
  noticeParagraph.innerHTML = custom_html;
}

function resetTable() {
  // reset table back to default values
  let htmltable = document.getElementById("fileOutput").children[0];
  let stickers = ["HEADER", "None", "White", "Red", "Green", "Black", "Blue", "Purple", "Orange", "Gold", "Total"];
  htmltable.innerHTML = "";
  for (let sticker of stickers) {
    let newtr = document.createElement("tr");
    if (sticker === "HEADER") {
      for (let text of ["Sticker", "Count", "Jokers..."]) {
        let newth = document.createElement("th");
        newth.textContent = text;
        newtr.appendChild(newth);
      }
    } else {
      for (let text of [sticker, 0, ""]) {
        let newtd = document.createElement("td");
        newtd.textContent = text;
        newtr.appendChild(newtd);
      }
    }
    htmltable.appendChild(newtr);
  }
}

function formatJokerName(joker_name) {
  let formatter = {'j_joker': 'Joker', 'j_greedy_joker': 'Greedy Joker', 'j_lusty_joker': 'Lusty Joker', 'j_wrathful_joker': 'Wrathful Joker', 'j_gluttenous_joker': 'Gluttonous Joker', 'j_jolly': 'Jolly Joker', 'j_zany': 'Zany Joker', 'j_mad': 'Mad Joker', 'j_crazy': 'Crazy Joker', 'j_droll': 'Droll Joker', 'j_sly': 'Sly Joker', 'j_wily': 'Wily Joker', 'j_clever': 'Clever Joker', 'j_devious': 'Devious Joker', 'j_crafty': 'Crafty Joker', 'j_half': 'Half Joker', 'j_stencil': 'Joker Stencil', 'j_four_fingers': 'Four Fingers', 'j_mime': 'Mime', 'j_credit_card': 'Credit Card', 'j_ceremonial': 'Ceremonial Dagger', 'j_banner': 'Banner', 'j_mystic_summit': 'Mystic Summit', 'j_marble': 'Marble Joker', 'j_loyalty_card': 'Loyalty Card', 'j_8_ball': '8 Ball', 'j_misprint': 'Misprint', 'j_dusk': 'Dusk', 'j_raised_fist': 'Raised Fist', 'j_chaos': 'Chaos the Clown', 'j_fibonacci': 'Fibonacci', 'j_steel_joker': 'Steel Joker', 'j_scary_face': 'Scary Face', 'j_abstract': 'Abstract Joker', 'j_delayed_grat': 'Delayed Gratification', 'j_hack': 'Hack', 'j_pareidolia': 'Pareidolia', 'j_gros_michel': 'Gros Michel', 'j_even_steven': 'Even Steven', 'j_odd_todd': 'Odd Todd', 'j_scholar': 'Scholar', 'j_business': 'Business Card', 'j_supernova': 'Supernova', 'j_ride_the_bus': 'Ride the Bus', 'j_space': 'Space Joker', 'j_egg': 'Egg', 'j_burglar': 'Burglar', 'j_blackboard': 'Blackboard', 'j_runner': 'Runner', 'j_ice_cream': 'Ice Cream', 'j_dna': 'DNA', 'j_splash': 'Splash', 'j_blue_joker': 'Blue Joker', 'j_sixth_sense': 'Sixth Sense', 'j_constellation': 'Constellation', 'j_hiker': 'Hiker', 'j_faceless': 'Faceless Joker', 'j_green_joker': 'Green Joker', 'j_superposition': 'Superposition', 'j_todo_list': 'To Do List', 'j_cavendish': 'Cavendish', 'j_card_sharp': 'Card Sharp', 'j_red_card': 'Red Card', 'j_madness': 'Madness', 'j_square': 'Square Joker', 'j_seance': 'Séance', 'j_riff_raff': 'Riff&#8209;Raff', 'j_vampire': 'Vampire', 'j_shortcut': 'Shortcut', 'j_hologram': 'Hologram', 'j_vagabond': 'Vagabond', 'j_baron': 'Baron', 'j_cloud_9': 'Cloud 9', 'j_rocket': 'Rocket', 'j_obelisk': 'Obelisk', 'j_midas_mask': 'Midas Mask', 'j_luchador': 'Luchador', 'j_photograph': 'Photograph', 'j_gift': 'Gift Card', 'j_turtle_bean': 'Turtle Bean', 'j_erosion': 'Erosion', 'j_reserved_parking': 'Reserved Parking', 'j_mail': 'Mail&#8209;In Rebate', 'j_to_the_moon': 'To the Moon', 'j_hallucination': 'Hallucination', 'j_fortune_teller': 'Fortune Teller', 'j_juggler': 'Juggler', 'j_drunkard': 'Drunkard', 'j_stone': 'Stone Joker', 'j_golden': 'Golden Joker', 'j_lucky_cat': 'Lucky Cat', 'j_baseball': 'Baseball Card', 'j_bull': 'Bull', 'j_diet_cola': 'Diet Cola', 'j_trading': 'Trading Card', 'j_flash': 'Flash Card', 'j_popcorn': 'Popcorn', 'j_trousers': 'Spare Trousers', 'j_ancient': 'Ancient Joker', 'j_ramen': 'Ramen', 'j_walkie_talkie': 'Walkie Talkie', 'j_selzer': 'Seltzer', 'j_castle': 'Castle', 'j_smiley': 'Smiley Face', 'j_campfire': 'Campfire', 'j_ticket': 'Golden Ticket', 'j_mr_bones': 'Mr. Bones', 'j_acrobat': 'Acrobat', 'j_sock_and_buskin': 'Sock and Buskin', 'j_swashbuckler': 'Swashbuckler', 'j_troubadour': 'Troubadour', 'j_certificate': 'Certificate', 'j_smeared': 'Smeared Joker', 'j_throwback': 'Throwback', 'j_hanging_chad': 'Hanging Chad', 'j_rough_gem': 'Rough Gem', 'j_bloodstone': 'Bloodstone', 'j_arrowhead': 'Arrowhead', 'j_onyx_agate': 'Onyx Agate', 'j_glass': 'Glass Joker', 'j_ring_master': 'Showman', 'j_flower_pot': 'Flower Pot', 'j_blueprint': 'Blueprint', 'j_wee': 'Wee Joker', 'j_merry_andy': 'Merry Andy', 'j_oops': 'Oops! All 6s', 'j_idol': 'The Idol', 'j_seeing_double': 'Seeing Double', 'j_matador': 'Matador', 'j_hit_the_road': 'Hit the Road', 'j_duo': 'The Duo', 'j_trio': 'The Trio', 'j_family': 'The Family', 'j_order': 'The Order', 'j_tribe': 'The Tribe', 'j_stuntman': 'Stuntman', 'j_invisible': 'Invisible Joker', 'j_brainstorm': 'Brainstorm', 'j_satellite': 'Satellite', 'j_shoot_the_moon': 'Shoot the Moon', 'j_drivers_license': "Driver's License", 'j_cartomancer': 'Cartomancer', 'j_astronomer': 'Astronomer', 'j_burnt': 'Burnt Joker', 'j_bootstraps': 'Bootstraps', 'j_caino': 'Canio', 'j_triboulet': 'Triboulet', 'j_yorick': 'Yorick', 'j_chicot': 'Chicot', 'j_perkeo': 'Perkeo'};
  let result = formatter[joker_name];
  if (result !== undefined) {
    return result.replaceAll(" ", "&nbsp;");
  }
  console.log(`Did not recognize joker '${joker_name}'.`)
  return joker_name.substring(2).replaceAll("_", "&nbsp;") + "?";
}

function updateTableRow(sticker, joker_name, change=1) {
  let htmlrow = document.getElementById("fileOutput").children[0].children[sticker+1];
  let counter = parseInt(htmlrow.children[1].textContent);
  counter += change;
  htmlrow.children[1].textContent = counter;
  let htmljokers = htmlrow.children[2];
  if (htmljokers.textContent !== "" && joker_name !== "") {
    htmljokers.innerHTML += ",  ";
  }
  htmljokers.innerHTML += joker_name;
}

function updateTable(parsed_save_file) {
  resetTable();
  for (let [joker, values] of Object.entries(parsed_save_file.joker_usage)) {
    let highest_sticker = Math.max(0, ...Object.keys(values.wins));
    updateTableRow(highest_sticker, formatJokerName(joker));
  }
  updateTableRow(9, "", Object.keys(saveFileParsed.joker_usage).length )
}

async function handleFile() {
  // handle the read the file, and update corresponding elements
  let userUpload = document.getElementById("saveFile");
  if (userUpload.files[0].name !== "profile.jkr") {
    let href = `<a href='https://www.pcgamingwiki.com/wiki/Balatro#Save_game_data_location'>Where to find profile.jkr</a>`
    updateNotice(`Incorrectly named file '${userUpload.files[0].name}'! Use 'profile.jkr' instead. ${href}.`);
    resetTable();
  } else {
    saveFile = await readFile(userUpload);
    saveFileParsed = jsonifySaveFile(saveFile);
    globalThis.saveFileParsed = saveFileParsed;
    updateNotice("");
    updateTable(saveFileParsed);
  }
}

document.getElementById("saveFile").addEventListener("change", handleFile);
globalThis.updateTable = updateTable;
window.onload = resetTable;
