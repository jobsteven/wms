// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-13 10:56:03
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-05-25 19:00:26
//  Description: wms-peer
//
// //////////////////////////////////////////////////////////////////////////////

import Emiter from 'tinyEmiter';
import uuid from 'uuid';
import ip from 'ip-regex';
import Promise from 'bluebird';

export default class Peer extends Emiter {
  constructor(mediaPipeline, webRtcEndpoint) {
    super();
    this.mode = '';
    this.id = uuid.v4();
    this._connected = false;
    this.mediaPipeline = mediaPipeline;
    this.webRtcEndpoint = webRtcEndpoint;
    this.webRtcEndpoint.on('OnRelease', this._webRtcEndpointOnRelease.bind(this));
    this.webRtcEndpoint.on('OnIceComponentStateChanged', (stateInfo) => {
      // console.log('OnIceComponentStateChanged');
      if (stateInfo.state === 'CONNECTED') {
        this.connected = true;
      }
      if (stateInfo.state === 'DISCONNECTED' || stateInfo.state === 'FAILED') {
        this.connected = false;
      }
    })
    this.webRtcEndpoint.on('OnIceCandidate', ({
      candidate: { candidate, sdpMLineIndex, sdpMid }
    }) => {
      // fliter ipv6
      if (ip.v6().test(candidate)) return
      this._signalHandler({
        candidate,
        sdpMLineIndex,
        sdpMid
      })
    });
  }

  set remotePeer(remotePeer) {
    this._remotePeer = remotePeer;
  }

  _webRtcEndpointOnRelease() {
    // console.log('WebRtcEndpoint onRelase');
    this.id = null;
    this.connected = false;
    this.mediaPipeline = null;
    this.webRtcEndpoint = null;
    if (this._remotePeer) {
      this._remotePeer.sendJSON({
        code: 'close'
      })
      this._remotePeer = null;
    }
    this.emit('OnRelease');
  }

  set connected(_c) {
    if (_c !== this._connected) {
      this._connected = _c;
      _c ? this.emit('CONNECTED') : this.emit('DISCONNECTED');
    }
  }

  get connected() {
    return this._connected;
  }

  _signalHandler(data) {
    if (this._remotePeer) {
      this._remotePeer.sendJSON({
        code: 'signal',
        data
      })
    }
  }

  processOffer(offer) {
    return this.webRtcEndpoint.processOffer(offer)
  }

  generateOffer() {
    return this.webRtcEndpoint.generateOffer().then(offer => {
      offer.sdp = offer.sdp.split('\r\n').reduce((modsdp, item) => {
        modsdp.push(item);
        if (item.indexOf('m=audio') === 0 || item.indexOf('m=video') === 0) {
          modsdp.push(this.mode === 'pub' ? 'a=recvonly' : 'a=sendonly')
        }
        return modsdp;
      }, []).join('\r\n')
      return offer
    })
  }

  processAnswer(answer) {
    return this.webRtcEndpoint.processAnswer(answer)
  }

  gatherCandidates() {
    return this.webRtcEndpoint.gatherCandidates();
  }

  addIceCandidate(candidate) {
    return this.webRtcEndpoint.addIceCandidate(candidate);
  }

  getStats(mediaType) {
    return this.webRtcEndpoint.getStats(mediaType);
  }

  signal(sig) {
    return Promise.try(() => {
      // offer
      if (sig.sdp && sig.type === 'offer') {
        return this.processOffer(sig).then((answer) => this.gatherCandidates().return(answer))
      }

      // answer
      if (sig.sdp && sig.type === 'answer') {
        return this.processAnswer(sig).then(() => this.gatherCandidates()).return('')
      }

      // candidate
      if (sig.candidate) {
        return this.addIceCandidate(sig)
      }

      throw new Error('Unknown Signal.')
    })
  }
}