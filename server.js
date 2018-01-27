'use strict';

require('dotenv').load();

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(bodyParser.urlencoded({extended: false}));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/locations/:pageToken?', (req, res) => {
  //TODO retrieve five results at a time
  const pageToken = req.params.pageToken;
  if (pageToken) {
    //TODO handle w/ page token, return next set of results
  } else {
    //TODO handle w/ lat long
    const lat = req.query.lat;
    const lng = req.query.lng;

    const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    const config = {
      params: {
        location: `${lat},${lng}`,
        rankby: `distance`,
        type: `restaurant`,
        key: process.env.GMAPS_API_KEY
      }
    };

    axios.get(apiUrl, config)
      .then(response => {
        res.send(response.data);
      }).catch(err => {
        console.error(err);
        //TODO return 500 error
        res.status(500).send(JSON.stringify(err));
      });
  }
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Server listening at port ${port}.`);
});