// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-12 20:23:55
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-05-25 19:18:22
//  Description: wms-webRtcEndpoint
//
// //////////////////////////////////////////////////////////////////////////////

import MediaElement from './mediaElement.js';
import Promise from 'bluebird';

export default class WebRtcEndpoint extends MediaElement {
  subscribeEvents() {
    // "OnIceCandidate",
    // "OnIceGatheringDone",
    // "OnIceComponentStateChanged",
    // "OnDataChannelOpened",
    // "OnDataChannelClosed",
    // "NewCandidatePairSelected"
    return Promise
      .props({
        OnIceCandidate: this.kws.subscribe(this.id, 'OnIceCandidate'),
        OnIceComponentStateChanged: this.kws.subscribe(this.id, 'OnIceComponentStateChanged')
      })
      .then(subscribes => {
        Object.entries(subscribes).forEach((subscribeItem) => {
          const subscribeEvent = subscribeItem[0];
          const subscribeResult = subscribeItem[1];
          if (subscribeResult.isFulfilled()) {
            this[subscribeEvent] = subscribeResult.value().value;
            this.kws.on(`${this.id}/${subscribeEvent}`, event => this.emit(subscribeEvent, event));
          }
        })
      })
      .return(this)
  }

  createDataChannel() {
    return this.kws
      .invoke(this.id, 'createDataChannel', { label: 'default' })
      .return(this)
  }

  gatherCandidates() {
    return this.kws
      .invoke(this.id, 'gatherCandidates')
      .return(this)
  }

  generateOffer() {
    return this.kws
      .invoke(this.id, 'generateOffer')
      .then(offerInfo => ({ type: 'offer', sdp: offerInfo.value.replace(/kurento/gi, 'WMS') }))
  }

  processOffer(offer) {
    return this.kws
      .invoke(this.id, 'processOffer', { offer: offer.sdp })
      .then(answerInfo => ({ type: 'answer', sdp: answerInfo.value }))
  }

  processAnswer(answer) {
    return this.kws
      .invoke(this.id, 'processAnswer', { answer: answer.sdp })
      .then(() => this.gatherCandidates())
      .return('')
  }

  addIceCandidate({ candidate, sdpMLineIndex, sdpMid }) {
    return Promise.try(() => this.kws
      .invoke(this.id, 'addIceCandidate', {
        candidate: {
          candidate,
          sdpMLineIndex,
          sdpMid
        }
      })
      .return('')
    )
  }

  getStats(mediaType = undefined) {
    return this.kws
      .invoke(this.id, 'getStats', { mediaType })
      .then(statesInfo => statesInfo.value)
  }

  // AUDIO 0kbps ~ 500kbps
  // VIDEO 100kbps ~ 2048kbps

  setMaxVideoRecvBandwidth() {
    return this.kws
      .invoke(this.id, 'setMaxVideoRecvBandwidth', { maxVideoRecvBandwidth: 2048 })
      .return(this)
  }

  setMaxVideoSendBandwidth() {
    return this.kws
      .invoke(this.id, 'setMaxVideoSendBandwidth', { maxVideoSendBandwidth: 2048 })
      .return(this)
  }
}