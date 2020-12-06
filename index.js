const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
const SpotifyWebApi = require('spotify-web-api-node')

//Sets up the server
const app = express()
//Configures our workspace to use the .env file
dotenv.config()

//Where the user will be redirected after accepting to use our app
const url = "http://localhost:3000/spotify/"
//Creating an object to handle our spotify authorization
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: url
});

//we will get an access token later and store it in this variable
let access_token = "";


//creates a route at http://localhost:3000/
app.get("/", (request, response) => {
    //This is a list of permission we want from the user
    const scopes = ['user-top-read'];
    //Show the user the approval page after the first acceptance
    const showDialog = true;
    //Spotify URL for the user to authorize the app
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, null, showDialog)
    response.redirect(authorizeURL)
})

//Route to exchange an access code for an access token
app.get("/spotify", (request, response) => {
    const authCode = request.query.code
    spotifyApi.authorizationCodeGrant(authCode)
    .then(spotifyResponse => {
        access_token = "Bearer " + spotifyResponse.body.access_token;
        response.redirect('http://localhost:3000/tracks')
    }, error => {
        console.log('Something went wrong when retrieving the access token!', err.message);
    })
})

//Route to display a user's top tracks
app.get("/tracks", (request, response) => {
    const term = "long_term" //other options are short_term, medium_term
    const limit = 20 //amount of tracks to retrieve option are 1-50
    axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=${term}&limit=${limit}`, {headers: {Authorization: access_token}})
    .then(trackData => {
        const output = trackData.data.items.map(track => {
            return {
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                href: track.href //link to a 30 second preview
            }
        })
        response.send(output);
    })
    .catch(error => console.log(error.message))
})

app.get('/artists', (request, response) => {
    const term = "long_term" //other options are short_term, medium_term
    const limit = 20 //amount of tracks to retrieve option are 1-50	
    axios.get(`https://api.spotify.com/v1/me/top/artists?time_range=${term}&limit=${limit}`, {headers: {Authorization: access_token}})
    .then(artistData => {
        const output = artistData.data.items.map(artist => {
            return {
                name: artist.name,
                genres: artist.genres,
                followers: artist.followers.total
            }
        })
        response.send(output);
    })
    .catch(err => console.log(err.message))

})





app.listen(3000, () => {
    console.log('Server created on port 3000')
})
