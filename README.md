# Code for bogoGram
## Installation (of necessary dependencies)
Run the following command after cloning the repository
`npm install`

## Usage
Then run this command to start the web application
`npm run start`

## Play-testing
- Due to firebase and reCaptcha, we do not recommend attempting to play-test this game from your machine's localhost. You need to be logged into the necessary firebase and google accounts for your client to generate authentication tokens on reCaptcha to not be blocked by reCaptcha on the server side, and same goes for cloud functions that we call to make the game run.
- Hence, we instead recommend going to https://bogogram-64426.web.app/ and playing the game there. Enjoy!

## WARNING
We do not recommend opening the following files in case it potentially crashes our IDE:
* populateTrie.js
* serializaTrie.js
* words.csv
* wordsArray.csv
