// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-20 14:41:40
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-05-24 20:44:39
//  Description: wms-rec
//
// //////////////////////////////////////////////////////////////////////////////
import uuid from 'uuid';

export default class Rec {
  constructor(pub, recorderEndpoint) {
    this.id = uuid.v4();
    this.pub = pub;
    this.recorderEndpoint = recorderEndpoint;
    this.recorderEndpoint.on('OnRelease', this.recOnRelease.bind(this));
    this.pub.on('OnRelease', this.pubOnRelease.bind(this));
    this.pub.on('CONNECTED', () => {
      this.record().then(() => {
        console.log('record start ->', this.pub.id);
      }).catch((err) => {
        console.error('recording error', err);
      })
    })
    this.pub.on('DISCONNECTED', () => {
      this.stopAndWait().then(() => {
        console.log('record stop.');
      }).catch((err) => {
        console.error('catch ->', err);
      })
    })
  }

  record() {
    return this.recorderEndpoint.record()
  }

  stopAndWait() {
    return this.recorderEndpoint.stopAndWait()
  }

  pubOnRelease() {
    console.log('Pub OnRelease -> Rec release', this.pub.id);
    this.release();
  }

  release() {
    console.log('Rec release');
    this.recorderEndpoint.release()
  }

  recOnRelease() {
    console.log('Rec OnRelease');
    this.id = null;
    this.pub = null;
    this.recorderEndpoint = null;
  }
}