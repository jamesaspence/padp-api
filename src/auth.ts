import * as jwt from 'jsonwebtoken';

export type DecodedToken = {
  sub: string,
  picture: string,
  firstName: string,
  lastName: string
};

export const verifyToken = async (token: string): Promise<DecodedToken|null> =>  {
  try {
    return jwt.verify(token, process.env.APP_SECRET);
  } catch (e) {
    //TODO potentially throw error instead
    //TODO should be a full stop if error occurs during verification
    return null;
  }
};

export const signToken = (payload: {}): Buffer => jwt.sign(payload, process.env.APP_SECRET, { expiresIn: '2h' });