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
  "Cheerful", "Curious", "Loving", "Noble", "Quick", "Speedy", "Sneaky"];
const colours = ["Red", "Blue", "Green", "Yellow", "Pink", "Orange", "Brown",
  "Purple", "White", "Black", "Violet", "Aquamarine", "Magenta", "Maroon",
  "Silver"];
const animals = ["Dog", "Cat", "Elephant", "Lion", "Tiger", "Giraffe", "Bear",
  "Dolphin", "Horse", "Penguin", "Monkey", "Kangaroo", "Zebra", "Rabbit",
  "Panda", "Snake", "Mouse", "Pig", "Dragon", "Deer", "Unicorn", "Chicken",
  "Cow", "Koala", "Emu", "Crow", "Raven", "Turkey", "Kingfisher", "Hummingbird",
  "Whale", "Shark", "Eel", "Mudskipper", "Stingray", "Seahorse", "Dolphin",
  "Crab", "Lobster", "Crayfish", "Guppy", "Tuna", "Salmon", "Eagle",
  "Panther", "Leopard", "Hawk", "Cod", "Swordfish", "Rhino", "Sardines",
  "Wolf", "Turtle", "Capybara", "Frog", "Slug", "Sloth", "Goat", "Hamster"];
// 15930 possibilities

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
  if (1 <= numPlayers && numPlayers <= 4) {
    return 21;
  } else if (5 <= numPlayers && numPlayers <= 6) {
    return 15;
  } else if (7 <= numPlayers && numPlayers <= 8) {
    return 11;
  } else {
    return 0;
  }
}

/**
 * Determines a random number below the maximum number provided
 *
 * @param {int} num – The maximum number of tiles
 * @param {int} numPlayers – the number of players
 * @return {[int]} number of Tiles
 */
function mathRand(num, numPlayers) {
  const cat2 = Math.floor(Math.random() * (num));
  const cat1 = Math.floor(Math.random() * (num));
  const cat0 = numTilesPerPlayer(numPlayers) - cat1 - cat2;
  return [cat0, cat1, cat2];
}

/**
 * Determines the number of tiles per player
 *
 * @param {int} numPlayers – The number of players playing the game
 * @return {[int]} number of Tiles per player per type
 */
function numTilesPerCat(numPlayers) {
  if (1 <= numPlayers && numPlayers <= 4) {
    return mathRand(5, numPlayers);
  } else if (5 <= numPlayers && numPlayers <= 6) {
    return mathRand(3, numPlayers);
  } else if (7 <= numPlayers && numPlayers <= 8) {
    return mathRand(2, numPlayers);
  }
  return [];
}

exports.createGame = functions.https.onCall(async (data, content) => {
  if (!content.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "call the function when authenticated");
  }
  const gameID = generateGameId();
  const gameData = {
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    playerID: [content.auth.uid],
    tilesInBag: true,
    gameOver: false,
    gameWinner: "",
    beastMode: data.beastMode || false,
  };

  if (data.beastMode) {
    const letters0 = "AAAAEEEEEEEEEEEEEEEEEE" +
                     "IIIIIIIIIIIIOOOOOOOOOOO" +
                     "UUUUUULLLLLNNNNNNNNSSSSSS" +
                     "RRRRRRRRRTTTTTTTTT";
    const letters1 = "DDDGGGGBBBCCCMMMPPP"; // 19 chars
    const letters2 = "FFFHHHVVVWWXXYYYZZJJKKQQ";
    gameData.tiles0 = shuffleArray(letters0.split(""));
    gameData.tiles1 = shuffleArray(letters1.split(""));
    gameData.tiles2 = shuffleArray(letters2.split(""));
    gameData.tilesDistributed = false;
  } else {
    const letters = "AAAABBBCCCDDDDEEEEEEEEEEEEEEEEEE" +
                    "FFFGGGGHHHIIIIIIIIIIIIJJKKLLLLLMMM" +
                    "NNNNNNNNOOOOOOOOOOOPPPQQRRRRRRRRR" +
                    "SSSSSSTTTTTTTTTUUUUUUVVVWWWXXYYYZZ";
    // for testing
    // const letters = "FISHYELLOWCRABONEMOREAPPLE";
    gameData.tiles = shuffleArray(letters.split(""));
    gameData.tilesDistributed = false;
  }

  const gameDataRef = firestore.collection("gameData").doc(gameID);
  await gameDataRef.set(gameData);
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
    return {
      message: "Game not found",
    };
  }
  const gameData = doc.data();
  const gameStarted = gameData.tilesDistributed;
  if (gameStarted) {
    return {
      message: "Game has already started",
    };
  }
  await gameDataRef.update({
    playerID: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
  });
  return {
    message: "Successfully joined the game",
    beastMode: gameData.beastMode || false,
  };
});


exports.distributeTiles = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "The function must be called while authenticated.");
  }
  const gameDataRef = admin.firestore().collection("gameData").doc(data.gameID);
  const doc = await gameDataRef.get();
  if (!doc.exists) {
    throw new Error("Game not found.");
  }
  const gameData = doc.data();
  const playerIDs = gameData.playerID;
  const numTiles = numTilesPerPlayer(playerIDs.length);
  // Only used in non-beast mode
  const tileDistributions = {};

  if (gameData.beastMode) {
    // Retrieve tile arrays for each category from the document
    const tiles0 = gameData.tiles0 || [];
    const tiles1 = gameData.tiles1 || [];
    const tiles2 = gameData.tiles2 || [];
    const numTilesCategories = numTilesPerCat(playerIDs.length);

    playerIDs.forEach((playerID) => {
      tileDistributions[playerID] = [];
      [tiles0, tiles1, tiles2].forEach((tileArray, index) => {
        const numTilesFromCategory = numTilesCategories[index];
        tileDistributions[playerID] = tileDistributions[playerID]
            .concat(tileArray.splice(0, numTilesFromCategory));
      });
    });

    // Update the document with modified tile arrays and distributions
    await gameDataRef.update({
      tiles0: tiles0,
      tiles1: tiles1,
      tiles2: tiles2,
      tileDistribution: tileDistributions,
      tilesDistributed: true,
      tileUpdates: {},
    });
  } else {
    const tiles = gameData.tiles || [];
    let startIndex = 0;
    playerIDs.forEach((playerID) => {
      tileDistributions[playerID] = tiles
          .slice(startIndex, startIndex + numTiles);
      startIndex += numTiles;
    });

    // Update tiles remaining in the array
    await gameDataRef.update({
      tiles: tiles.slice(startIndex),
      tileDistribution: tileDistributions,
      tilesDistributed: true,
      tileUpdates: {},
    });
  }

  return {status: "Tiles distributed"};
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

  const gameData = doc.data();
  const playerIDs = gameData.playerID;
  const tileUpdates = gameData.tileUpdates || {};
  let tilesUpdated = false;

  // Update tiles based on whether it is a beast mode game
  if (gameData.beastMode) {
    const tiles0 = gameData.tiles0 || [];
    const tiles1 = gameData.tiles1 || [];
    const tiles2 = gameData.tiles2 || [];
    const tilesCategories = [tiles0, tiles1, tiles2];

    playerIDs.forEach((playerID) => {
      if (!tileUpdates[playerID]) {
        tileUpdates[playerID] = [];
      }
      // Distribute 3 tiles, prioritize from lower value arrays
      for (let i = 0; i < 3; i++) {
        for (const tiles of tilesCategories) {
          if (tiles.length > 0) {
            tileUpdates[playerID].push(tiles.shift());
            tilesUpdated = true;
            break;
          }
        }
      }
    });
    // Update Firestore document with new tile arrays
    await gameDataRef.update({
      tiles0: tiles0,
      tiles1: tiles1,
      tiles2: tiles2,
      tileUpdates: tileUpdates,
      tilesInBag: tiles0.length > 0 || tiles1.length > 0 ||
      tiles2.length > playerIDs.length,
    });
  } else {
    // Handle regular game mode
    const serverTiles = gameData.tiles || [];

    playerIDs.forEach((playerID) => {
      if (serverTiles.length > 0) {
        if (!tileUpdates[playerID]) {
          tileUpdates[playerID] = [];
        }
        tileUpdates[playerID].push(serverTiles.shift());
        // Peel one tile per player
        tilesUpdated = true;
      }
    });

    await gameDataRef.update({
      tiles: serverTiles,
      tileUpdates: tileUpdates,
      tilesInBag: serverTiles.length > 0,
    });
  }

  return tilesUpdated ? {status: "Tiles distributed"} :
  {status: "Bag is empty!"};
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

  const gameData = doc.data();
  let serverTiles = gameData.tiles;
  const playerIDs = gameData.playerID;
  const dumpedTile = data.tile.toUpperCase();

  if (gameData.beastMode) {
    const coin = Math.floor(Math.random() * 2);
    if (playerIDs.length === 1 || coin) {
      const tiles0 = gameData.tiles0 || [];
      const tiles1 = gameData.tiles1 || [];
      const tiles2 = gameData.tiles2 || [];

      if ("AEIOULNSRT".includes(dumpedTile)) {
        tiles0.push(dumpedTile);
      } else if ("DGBCMP".includes(dumpedTile)) {
        tiles1.push(dumpedTile);
      } else if ("FHVWXYZJKQ".includes(dumpedTile)) {
        tiles2.push(dumpedTile);
      } else {
        console.error("Dumped tile does not match any category:", dumpedTile);
      }

      serverTiles = [tiles0, tiles1, tiles2];
      const tilesToPlayer = [];

      // Return 5 tiles starting from the lower value arrays
      for (let i = 0; i < 5; i++) {
        for (const tiles of serverTiles) {
          if (tiles.length > 0) {
            tilesToPlayer.push(tiles.shift());
            if (tilesToPlayer.length === 5) break;
          }
        }
        if (tilesToPlayer.length === 5) break;
      }

      await gameDataRef.update({
        tiles0: tiles0,
        tiles1: tiles1,
        tiles2: tiles2,
        tilesInBag: tiles0.length > 0 || tiles1.length > 0 || tiles2.length > 0,
      });

      return {tiles: tilesToPlayer};
    } else {
      const otherPlayerIDs = playerIDs.filter((id) => id !== context.auth.uid);
      const randomPlayerIndex = Math.floor(Math.random() *
      otherPlayerIDs.length);
      const randomPlayerID = otherPlayerIDs[randomPlayerIndex];
      const tileUpdates = gameData.tileUpdates || {};
      if (!tileUpdates[randomPlayerID]) {
        tileUpdates[randomPlayerID] = [];
      }
      tileUpdates[randomPlayerID].push(dumpedTile);
      await gameDataRef.update({
        tileUpdates: tileUpdates,
      });
      return {status: "Tile given to another player"};
    }
  } else {
    // Normal gameplay logic
    if (serverTiles.length < 3) {
      await gameDataRef.update({
        tilesInBag: false,
      });
      return {tiles: serverTiles};
    }
    const randomIndex = Math.floor(Math.random() * serverTiles.length);
    serverTiles = [
      ...serverTiles.slice(0, randomIndex), dumpedTile,
      ...serverTiles.slice(randomIndex),
    ];
    const bagTiles = (serverTiles.length - 3) >= playerIDs.length;
    // Update for 5 tiles
    const tilesToPlayer = serverTiles.slice(0, 3);

    await gameDataRef.update({
      tiles: serverTiles.slice(3),
      tilesInBag: bagTiles,
    });

    return {tiles: tilesToPlayer};
  }
});

exports.updateLeaderboard = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "The function must be called while authenticated.");
  }

  const {finalTime} = data;
  const leaderboardRef = admin.firestore()
      .collection("leaderboard").doc("rankings");

  try {
    const leaderboardDoc = await leaderboardRef.get();
    const timings = leaderboardDoc.exists ? leaderboardDoc.data().timing : [];
    timings.push(finalTime);
    timings.sort((a, b) => a - b);
    await leaderboardRef.set({timing: timings}, {merge: true});
    const position = timings.indexOf(finalTime) + 1;
    return {position: position, message: `You are currently 
      ${position} on the leaderboard!`};
  } catch (error) {
    console.error("Failed to update leaderboard:", error);
    throw new functions.https.HttpsError("internal",
        "Unable to update leaderboard.");
  }
});

