var unirest = require('unirest')
var express = require('express')
var events = require('events')

var getFromApi = function (endpoint, args) {
  var emitter = new events.EventEmitter()
  unirest.get('https://api.spotify.com/v1/' + endpoint)
    .qs(args)
    .end(function (response) {
      if (response.ok) {
        emitter.emit('end', response.body)
      } else {
        emitter.emit('error', response.code)
      }
    })
  return emitter
}

var app = express()
app.use(express.static('public'))

app.get('/search/:name', function (req, res) {
  var searchReq = getFromApi('search', {
    q: req.params.name,
    limit: 1,
    type: 'artist'
  })
  searchReq.on('end', function (item) {
    const artist = item.artists.items[0] // Main artist
    const mainArtistId = item.artists.items[0].id // Main artist ID
    var getRelated = getFromApi('artists/' + mainArtistId + '/related-artists')
    getRelated.on('end', function (item) {
      artist.related = item.artists
      const artistsNumber = artist.related.length
      console.log(item.artists.length)
      for (var i = 0, j = 0; i < artistsNumber; i++) {
        const artistId = artist.related[i].id
        console.log(artist.related[i].name)
        var topTracks = getFromApi('artists/' + artistId + '/top-tracks', {
          country: 'SE'
        })
        topTracks.on('end', function (item) {
          console.log('Respuesta')
          artist.related[j].tracks = item.tracks
          j++
          if (j === artistsNumber) {
            console.log(item)
            console.log('Final')
            res.json(artist)
          }
        })
      }
      // var topTracks = getFromApi('artists/' + artistId + '/top-tracks')
    })
    getRelated.on('error', function () {
      res.sendStatus(404)
    })
  })

  searchReq.on('error', function (code) {
    res.sendStatus(code)
  })
})

app.listen(process.env.PORT || 8080)
