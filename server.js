'use strict';

require('dotenv').load();

const express = require('express');
const http = require('http');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const SocketManager = require('./socket');
const socketManager = new SocketManager(server);

const RandomString = require('randomstring');
const fs = require('fs');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/locations/:pageToken?', (req, res) => {
  const pageToken = req.params.pageToken;
  const config = {
    params: {
      key: process.env.GMAPS_API_KEY
    }
  };
  if (pageToken) {
    config.params.pagetoken = pageToken;
  } else {
    const lat = req.query.lat;
    const lng = req.query.lng;

    config.params.location = `${lat},${lng}`;
    config.params.rankby = `distance`;
    config.params.type = `restaurant`;
  }

  const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;

  axios.get(apiUrl, config)
    .then(response => {
      res.send(response.data);
    }).catch(err => {
      console.error(err);
      res.status(500).send(JSON.stringify(err));
    });
});

app.post('/session', (req, res) => {
  const data = req.body.selectedLocations;

  const namespaceKey = socketManager.createNamespace();

  fs.writeFile(`./sessions/${namespaceKey}.json`, JSON.stringify(data), err => {
    if (err) {
      //TODO handle properly
      //TODO consider making synchronous - can't exactly continue without data
      console.error(err);
    }
  });

  res.send({
    sessionId: namespaceKey
  });
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Server listening at port ${port}.`);
});