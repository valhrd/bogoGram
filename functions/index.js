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

exports.createGame = functions.https.onCall(async (data, content) => {
  if (!content.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "call the function when authenticated  ");
  }
  const letters = "AAABBBCCCDDDDEEEEEEEEEEEEEEEEEE" +
                  "FFFGGGGHHHIIIIIIIIIIIIJJKKLLLLLMMM" +
                  "NNNNNNNNOOOOOOOOOOOPPPQQRRRRRRRRR" +
                  "SSSSSSTTTTTTTTTUUUUUUVVVWWWXXYYYZZ";
  const shuffledLetters = shuffleArray(letters.split(""));
  const gameDataRef = firestore.collection("gameData").doc();
  await gameDataRef.set( {
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    playerID: content.auth.uid,
    tiles: shuffledLetters,
  });
  return {gameID: gameDataRef.id};
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
  if (tiles.length < 7) {
    throw new Error("Not enough tiles left.");
  }
  const tilesToPlayer = tiles.slice(0, 7);
  const remainingTiles = tiles.slice(7);

  await gameDataRef.update({tiles: remainingTiles});

  return {tiles: tilesToPlayer};
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

<<<<<<< Updated upstream
=======
/*
exports.singleEnd = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "The function must be called while authenticated.");
  }
  const leaderboardRef = admin.firestore().collection("leaderboard")
  .doc("rankings");
  const doc = await leaderboardRef.get();
  if (!doc.exists) {
    throw new Error("Game not found.");
  }
  const leaderboard = doc.data();
*/
>>>>>>> Stashed changes
