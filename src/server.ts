'use strict';

import { config } from 'dotenv';
import axios from 'axios';
import * as Koa from 'koa';
import * as cors from '@koa/cors';
import * as bodyParser from 'koa-bodyparser';
import * as Router from '@koa/router';
import SocketManager from './socket';
import * as fs from 'fs';
import { googleOAuth } from './middleware/auth';
import * as jwt from 'jsonwebtoken';

config();

const { APP_PORT = 4000, APP_SECRET } = process.env;

if (typeof APP_SECRET !== 'string' || APP_SECRET.length < 8) {
  throw new Error(`"APP_SECRET" is improperly set - please ensure it is at least 8 characters long.`);
}

const app: Koa = new Koa();
const server = app.listen(APP_PORT, () => console.log(`Server listening at port ${APP_PORT}.`));
const socketManager = new SocketManager(server);

app.use(bodyParser());
app.use(cors());

const router = new Router();
router.get('/locations/:pageToken*', async ctx => {
  const pageToken = ctx.params.pageToken;
  const config = {
    params: {
      key: process.env.GMAPS_API_KEY,
      pagetoken: null,
      location: null,
      rankby: null,
      type: null
    }
  };
  if (pageToken) {
    config.params.pagetoken = pageToken;
  } else {
    const lat = ctx.request.query.lat;
    const lng = ctx.request.query.lng;

    config.params.location = `${lat},${lng}`;
    config.params.rankby = `distance`;
    config.params.type = `restaurant`;
  }

  const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;

  try {
    const response = await axios.get(apiUrl, config);
    ctx.body = response.data;
  } catch (e) {
    ctx.status = 500;
    ctx.body = JSON.stringify(e);
  }
});

router.get('/data/:key', ctx => {
  const path = `./sessions/${ctx.params.key}.session`;
  if (!fs.existsSync(path)) {
    ctx.throw(404);
    return;
  }

  const buffer: Buffer = fs.readFileSync(path);

  ctx.body = JSON.parse(buffer.toString());
});

router.post('/oauth', googleOAuth, ctx => {
  const { google: { decoded } } = ctx.state;

  //TODO grab sub (id), picture, given_name (fname), and family name (lname). grab email too??

  const { sub, picture, given_name: firstName, family_name: lastName } = decoded;

  const jwtToken = jwt.sign({
    sub,
    picture,
    firstName,
    lastName
  }, process.env.APP_SECRET, { expiresIn: '2h' });

  ctx.body = {
    token: jwtToken
  };
});

router.post('/session', ctx => {
  const data = ctx.request.body.selectedLocations;

  const namespaceKey = socketManager.createNamespace();

  try {
    fs.writeFileSync(`./sessions/${namespaceKey}.session`, JSON.stringify(data));
    ctx.body = {
      sessionId: namespaceKey
    };
  } catch (e) {
    ctx.status = 500;
    ctx.body = JSON.stringify(e);
  }
});

app.use(router.routes());
app.use(router.allowedMethods());