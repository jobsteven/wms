// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-12 15:14:11
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-08-26 22:13:34
//  Description: wms-index
//  ENVS
// //////////////////////////////////////////////////////////////////////////////
const WebSocket = require('uws');
const Emiter = require('tinyEmiter').default;
const Promise = require('bluebird');
const uuid = require('uuid');

const APP_PATH = '/kurento';
const INVOKE_TIMEOUT = 3000;
const PING_TIMEOUT = 10000;
const RECONN_TIMEOUT = 1500;

import MediaPipeline from './mediaPipeline.js';
import WebRtcEndpoint from './webRtcEndpoint.js';
import RecorderEndpoint from './recorderEndpoint.js';
import RtpEndpoint from './rtpEndpoint.js';
import env from '../env.js';

import Pub from './pub.js';
import Sub from './sub.js';

export {
  Pub,
  Sub
}

class KWS extends Emiter {
  static Pub = Pub
  static Sub = Sub

  static OPEN = 'open'
  static CLOSE = 'CLOSE'

  constructor(options) {
    super();
    this._serverId = '';
    this._sessionId = '';
    this._options = Object.assign({
      host: '127.0.0.1',
      port: '8888'
    }, options);
    this._connectws();
  }

  get ready() {
    return this.wsclient && this.wsclient.readyState === this.wsclient.OPEN
  }

  // --------------helper --------------
  createPub(publishSettings = {}) {
    return this
      .createMediaPipeline()
      .then(mediaPipeline => this
        .createWebRtcEndpoint(mediaPipeline.id)
        .then(webRtcEndpoint => new Pub(this, mediaPipeline, webRtcEndpoint))
      )
      .then(pub => ((publishSettings.record && (publishSettings.audio || publishSettings.video)) ? pub.createRec(publishSettings.audio, publishSettings.video) : pub))
  }

  createMediaPipeline() {
    return this.create('MediaPipeline')
      .then(mediaPipelineInfo => new MediaPipeline(this, mediaPipelineInfo.value))
      .then(mediaPipeline => mediaPipeline.setLatencyStats().return(mediaPipeline))
  }

  createRecorderEndpoint(id, fid, mediaProfile) {
    return this.create('RecorderEndpoint', {
        mediaPipeline: id,
        mediaProfile: mediaProfile || 'WEBM', //WEBM,MP4 // WEBM_AUDIO_ONLY WEBM_VIDEO_ONLY
        stopOnEndOfStream: true,
        uri: `file://${env.REPO}/${fid}.webm`
      })
      .then(recordRtcEndpointInfo => new RecorderEndpoint(this, recordRtcEndpointInfo.value))
  }

  createRtpEndpoint(id) {
    return this.create('RtpEndpoint', {
        mediaPipeline: id
      })
      .then(rtpEndpointInfo => new RtpEndpoint(this, rtpEndpointInfo.value))
  }

  createWebRtcEndpoint(id) {
    return this.create('WebRtcEndpoint', {
        mediaPipeline: id,
        useDataChannels: true
      })
      .then(webRtcEndpointInfo => new WebRtcEndpoint(this, webRtcEndpointInfo.value))
      .then(webRtcEndpoint => webRtcEndpoint.subscribeEvents())
      .then(webRtcEndpoint => webRtcEndpoint.setMaxVideoSendBandwidth())
      .then(webRtcEndpoint => webRtcEndpoint.setMaxVideoRecvBandwidth())
  }

  // padType AUDIO, VIDEO and DATA
  connectMediaElement(srcMediaElementId, sinkMediaElementId, sinkType = undefined) {
    return this.invoke(srcMediaElementId, 'connect', { sink: sinkMediaElementId, mediaType: sinkType })
  }

  // --------------lower --------------

  create(mediaElementType, constructorParams = {}) {
    const createMsg = {
      method: 'create',
      params: {
        type: mediaElementType,
        constructorParams
      }
    }
    return this._send(createMsg)
  }

  invoke(mediaElementId, methodName, operationParams) {
    const invokeMsg = {
      method: 'invoke',
      params: {
        object: mediaElementId,
        operation: methodName,
        operationParams
      }
    }
    return this._send(invokeMsg)
  }

  subscribe(mediaElementId, eventType) {
    const subscribeMsg = {
      method: 'subscribe',
      params: {
        type: eventType,
        object: mediaElementId
      }
    }
    return this._send(subscribeMsg).reflect()
  }

  release(mediaElementId) {
    const releaseMsg = {
      method: 'release',
      params: {
        object: mediaElementId
      }
    }
    return this._send(releaseMsg)
  }

  unsubscribe(sessionId, mediaElementId, subscription) {
    const unsubscribeMsg = {
      method: 'unsubscribe',
      params: {
        subscription,
        object: mediaElementId
      }
    }
    return this._send(unsubscribeMsg)
  }

  ping() {
    const pingMsg = {
      method: 'ping',
      params: {
        interval: PING_TIMEOUT
      }
    }
    return this._send(pingMsg, PING_TIMEOUT)
  }

  _send(msg, timeout) {
    // json version
    const id = uuid.v4();
    msg.id = id;
    msg.jsonrpc = '2.0';
    if (this._sessionId) {
      msg.params.sessionId = this._sessionId;
    }
    return Promise.try(() => {
      if (this.ready) {
        return Promise
          .fromCallback((cb) => {
            this.wsclient.send(JSON.stringify(msg), cb);
          })
          .then(() => new Promise((ful, rej) => {
            this.once(msg.id, (resultInfo) => {
              if (resultInfo.error) {
                return rej(resultInfo.error)
              }
              return ful(resultInfo.result)
            })
          }))
          .timeout(timeout || INVOKE_TIMEOUT, 'INVOKE_TIMEOUT->' + JSON.stringify(msg))
      }
      throw new Error('KWS Not Ready.');
    })
  }

  _connect() {
    const connectMsg = {
      method: 'connect',
      params: {}
    }
    return this._send(connectMsg)
  }

  _connectws() {
    if (this.wsclient) {
      this.wsclient.removeAllListeners();
      this.wsclient = null;
    }
    const kwspath = `ws://${this._options.host}:${this._options.port}${APP_PATH}`;
    console.log(kwspath);
    const wsclient = new WebSocket(kwspath);
    wsclient.on('message', this._messageHandler.bind(this));
    wsclient.on('open', this._getSession.bind(this));
    wsclient.on('close', (code, reason) => {
      console.log(`[RELOAD] wsclient close.${code} ${reason}`);
      setTimeout(() => {
        this._connectws();
      }, RECONN_TIMEOUT)
    })
    wsclient.on('error', (error) => {
      console.log('wsclient error.', error);
      if (wsclient.readyState === WebSocket.OPEN) {
        return wsclient.close();
      }
      setTimeout(() => {
        this._connectws();
      }, RECONN_TIMEOUT)
    })
    this.wsclient = wsclient;
  }

  _getSession() {
    console.log('wsclient open.');
    this._connect()
      .then(sessionInfo => {
        this._sessionId = sessionInfo.sessionId;
        if (sessionInfo.serverId) {
          console.log('get new session.');
          this._serverId = sessionInfo.serverId;
        } else {
          console.log('restore session');
        }
        this.emit(KWS.OPEN);
      })
      .catch(() => {
        this._sessionId = '';
        this._serverId = '';
        this._getSession();
      })
  }

  _messageHandler(msg) {
    // console.log('ORIGIN->', msg);
    try {
      const deMsg = JSON.parse(msg);
      // c -> s
      if (deMsg.id) {
        return this.emit(deMsg.id, { error: deMsg.error, result: deMsg.result });
      }
      // s -> c
      if (deMsg.method && deMsg.method === 'onEvent') {
        const backendEvent = deMsg.params.value.data;
        return this.emit(`${backendEvent.source}/${backendEvent.type}`, backendEvent);
      }
      // s->c error
      if (deMsg.error) {
        return this.emit('error', deMsg.error)
      }
    } catch (e) {
      console.log('**EXCEPTION**', e);
    }
  }
}

export default new KWS({
  host: '127.0.0.1'
});