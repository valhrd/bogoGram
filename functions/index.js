/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions

*/
const functions = require("firebase-functions");
// Import and initialize the Firebase Admin SDK.
const admin = require("firebase-admin");
admin.initializeApp();
const firestore = admin.firestore();

const adjectives = ["Affectionate", "Majestic", "Playful", "Graceful", "Loyal",
  "Intelligent", "Gentle", "Energetic", "Vibrant", "Friendly", "Brave",
  "Cheerful", "Curious", "Loving", "Noble"];
const colours = ["Red", "Blue", "Green", "Yellow", "Pink", "Orange", "Brown",
  "Purple", "White", "Black"];
const animals = ["Dog", "Cat", "Elephant", "Lion", "Tiger", "Giraffe", "Bear",
  "Dolphin", "Horse", "Penguin", "Monkey", "Kangaroo", "Zebra", "Rabbit",
  "Panda", "Snake", "Mouse", "Pig", "Dragon", "Deer", "Unicorn", "Chicken",
  "Cow", "Koala", "Emu", "Crow", "Raven", "Turkey", "Kingfisher", "Hummingbird",
  "Whale", "Shark", "Eel", "Mudskipper", "Stingray", "Seahorse", "Dolphin",
  "Crab", "Lobster", "Crayfish", "Guppy", "Tuna", "Salmon", "Eagle",
  "Panther", "Leopard", "Hawk", "Cod", "Swordfish", "Rhino", "Sardines",
  "Wolf", "Turtle", "Capybara", "Frog", "Slug", "Sloth", "Goat", "Hamster"];
// 8850 possibilities

/**
 * Randomly generates a gameID from the adjectives, colours and animals above
 * @return {String} a gameID
 */
function generateGameId() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const color = colours[Math.floor(Math.random() * colours.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective}${color}${animal}`;
}
/**
 * Shuffles the elements of an array using the Fisher-Yates shuffle algorithm.
 *
 * @param {Array} array - The array to shuffle.
 * @return {Array} The shuffled array.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Determines the number of tiles per player
 *
 * @param {int} numPlayers – The number of players playing the game
 * @return {int} number of Tiles per player
 */
function numTilesPerPlayer(numPlayers) {
  if (2 <= numPlayers && numPlayers <= 4) {
    return 21;
  } else if (5 <= numPlayers && numPlayers <= 6) {
    return 15;
  } else if (7 <= numPlayers && numPlayers <= 8) {
    return 11;
  } else {
    return 0;
  }
}

exports.createGame = functions.https.onCall(async (data, content) => {
  if (!content.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "call the function when authenticated  ");
  }
  const gameID = generateGameId();
  const letters = "AAABBBCCCDDDDEEEEEEEEEEEEEEEEEE" +
                  "FFFGGGGHHHIIIIIIIIIIIIJJKKLLLLLMMM" +
                  "NNNNNNNNOOOOOOOOOOOPPPQQRRRRRRRRR" +
                  "SSSSSSTTTTTTTTTUUUUUUVVVWWWXXYYYZZ";
  const shuffledLetters = shuffleArray(letters.split(""));
  const gameDataRef = firestore.collection("gameData").doc(gameID);
  await gameDataRef.set( {
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    playerID: [content.auth.uid],
    tiles: shuffledLetters,
  });
  return {gameID: gameDataRef.id};
});

exports.joinGame = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "Must be authenticated to join game.");
  }
  const gameDataRef = firestore.collection("gameData").doc(data.gameID);
  const doc = await gameDataRef.get();
  if (!doc.exists) {
    throw new Error("Game not found.");
  }
  await gameDataRef.update({
    playerID: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
  });
  return {message: "Successfully joined the game"};
});


exports.distributeTiles = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "The function must be called while authenticated.");
  }

  const gameDataRef = admin.firestore().collection("gameData").doc(data.gameID);
  if (!(await gameDataRef.get()).exists) {
    throw new Error("Game not found.");
  }
  const doc = await gameDataRef.get();
  /* const letters = "AABBCCE"; */
  const tiles = doc.data().tiles;
  const gameData = doc.data();
  const playerIDs = gameData.playerID;
  const numTiles = numTilesPerPlayer(playerIDs.length);
  const tileDistributions = {};
  let maxIndex = 0;
  playerIDs.forEach((playerID, index) => {
    const playerTiles = tiles.slice(index * numTiles, (index + 1) * numTiles);
    tileDistributions[playerID] = playerTiles;
    maxIndex = (index + 1) * numTiles;
  });
  const remainingTiles = tiles.slice(maxIndex);
  await gameDataRef.update({
    tileDistribution: tileDistributions,
    tiles: remainingTiles,
    tilesDistributed: true,
  });
  return {status: "Tiles distributed"};
  /* const tilesToPlayer = tiles.slice(0, 7);
  const remainingTiles = tiles.slice(7);

  await gameDataRef.update({tiles: remainingTiles});

  return {tiles: tilesToPlayer};*/
});

exports.peel = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "The function must be called while authenticated.");
  }
  // Get the game document
  const gameDataRef = admin.firestore().collection("gameData").doc(data.gameID);
  const doc = await gameDataRef.get();
  // Check if the document exists
  if (!doc.exists) {
    throw new Error("Game not found.");
  }
  const serverTiles = doc.data().tiles;
  let tilesToPlayer;
  if (serverTiles.length === 0) {
    tilesToPlayer = "*";
  } else {
    tilesToPlayer = serverTiles[0];
    await gameDataRef.update({
      tiles: admin.firestore.FieldValue.arrayRemove(tilesToPlayer),
    });
  }
  // Return the tile
  return {tile: tilesToPlayer};
});

exports.dumpTile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "The function must be called while authenticated.");
  }

  const gameDataRef = admin.firestore().collection("gameData").doc(data.gameID);
  const doc = await gameDataRef.get();
  if (!doc.exists) {
    throw new Error("Game not found.");
  }

  let serverTiles = doc.data().tiles;
  // Handle the case where there are fewer than 3 tiles left
  if (serverTiles.length < 3) {
    await gameDataRef.update({
      tiles: admin.firestore.FieldValue.arrayRemove(...serverTiles),
    });
    return {tiles: serverTiles.concat(Array(3 - serverTiles.length).fill("*"))};
  }
  const randomIndex = Math.floor(Math.random() * serverTiles.length);
  serverTiles = [
    ...serverTiles.slice(0, randomIndex), data.tile,
    ...serverTiles.slice(randomIndex),
  ];
  const tilesToPlayer = serverTiles.slice(0, 3);
  await gameDataRef.update({
    tiles: serverTiles.slice(3),
  });

  return {tiles: tilesToPlayer};
});

