'use strict';

import { config } from 'dotenv';
import axios from 'axios';
import * as Koa from 'koa';
import * as cors from '@koa/cors';
import * as bodyParser from 'koa-bodyparser';
import * as Router from '@koa/router';
import SocketManager from './socket';
import * as fs from 'fs';

config();

const app: Koa = new Koa();
const { APP_PORT = 4000 } = process.env;
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
  const path = `./sessions/${ctx.params.key}.json`;
  if (!fs.existsSync(path)) {
    ctx.throw(404);
    return;
  }

  const buffer: Buffer = fs.readFileSync(path);

  ctx.body = JSON.parse(buffer.toString());
});

router.post('/session', ctx => {
  const data = ctx.request.body.selectedLocations;

  const namespaceKey = socketManager.createNamespace();

  try {
    fs.writeFileSync(`./sessions/${namespaceKey}.json`, JSON.stringify(data));
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