import uws from 'uws'
import url from 'url'
import jwt from 'jsonwebtoken'
import Emiter from 'tinyEmiter'
import MCODE from './mcode.js';
import env from './env.js';

export default class UWS extends Emiter {
  static OFFER = 'offer';
  static CANDIDATE = 'candidate';
  static PLAY = 'play';
  static PUBLISH = 'publish';
  static CLOSE = 'close';
  static ERROR = 'error';
  static WSCLIENT = 'wsclient';

  constructor(options) {
    super();
    this.options = Object.assign({
      host: '0.0.0.0',
      port: env.PORT,
      heartbeat: env.HEARTBEAT,
      key: env.KEY
    }, options)
    this.makeUWS();
  }

  get clients() {
    return this.uws.clients;
  }

  makeUWS() {
    this.uws = new uws.Server({
      host: this.options.host,
      port: this.options.port,
      verifyClient: this.verifyClient.bind(this)
    });
    this.uws.on('connection', this.umsConnection.bind(this));
    this.uws.on('listening', this.umsListening.bind(this));
    this.uws.startAutoPing(this.options.heartbeat);
  }

  umsListening() {
    console.log(`UWS is listening on ${this.options.host}:${this.options.port}`);
  }

  umsConnection(wsclient) {
    console.log('wsclient connection.');

    wsclient.on('close', (code, reason) => {
      console.log(`wsclient disconnection. code:${code} ${reason}`);
      wsclient.removeAllListeners();
      this.emit(MCODE.CLEAR, wsclient);
    })

    wsclient.on('error', (errmsg) => {
      console.log(`wsclient error. ${errmsg}`);
      wsclient.removeAllListeners();
      wsclient.close();
    });

    // deserialization
    wsclient.on('message', (incoming) => {
      try {
        const msg = JSON.parse(incoming);
        if (msg && msg.code) {
          this.emit(msg.code, {
            data: msg.data,
            wsclient
          });
        } else {
          console.log('wsclient protocal errors.');
          wsclient.send(JSON.stringify({
            code: MCODE.ERROR,
            data: 'protocal errors.'
          }))
        }
      } catch (error) {
        console.log('wsclient message errors.', error);
        wsclient.send(JSON.stringify({
          code: MCODE.ERROR,
          data: 'message errors.'
        }))
      }
    });

    // serialization
    wsclient.sendJSON = (msg) => {
      wsclient.send(JSON.stringify(msg));
    }
  }

  verifyClient(clientInfo) {
    try {
      const token = url.parse(clientInfo.req.url, true).query.token;
      // console.log(token);
      if (token) {
        try {
          const tokenInfo = jwt.verify(token, this.options.key);
          // console.log(tokenInfo);
          return tokenInfo;
        } catch (error) {
          throw new Error('token invalidation.');
        }
      }
      throw new Error('token required.');
    } catch (error) {
      console.log(`wsclient token invalidation. ${error}`);
      return false;
    }
  }
}
