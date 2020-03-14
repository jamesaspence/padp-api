import { Context, Middleware } from 'koa';
import { OAuth2Client } from 'google-auth-library';
import { verifyToken } from '../auth';

export const googleOAuth: Middleware = async (ctx, next): Promise<any> => {
  const token = decodeAuthHeader(ctx);

  if (token == null) {
    ctx.throw(422, 'JWT Token must be provided in "Authorization" header.');
    return;
  }

  const clientId = process.env.CLIENT_ID;
  const client = new OAuth2Client(clientId);
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId
    });
  } catch (e) {
    //TODO handle better
    ctx.throw(500, 'Unknown error during verification of token');
    return;
  }

  const payload = ticket.getPayload();

  ctx.state.google = {
    userToken: token,
    decoded: payload
  };

  await next();
};

export const jwtAuth: Middleware = async (ctx, next): Promise<any> => {
  const token = decodeAuthHeader(ctx);

  let decoded = await verifyToken(token);

  if (decoded === null) {
    ctx.throw(401, 'Invalid/expired token.');
    return;
  }

  ctx.state.user = decoded;

  await next();
};

const decodeAuthHeader = (ctx: Context) => {
  const { authorization } = ctx.request.header;

  if (authorization == null) {
    return null;
  }

  const headerParts = authorization.split(' ');
  if (headerParts.length !== 2 || headerParts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return headerParts[1];
};