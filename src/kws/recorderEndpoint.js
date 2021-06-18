// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-19 19:17:39
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-04-19 19:38:35
//  Description: wms-recorderEndpoint
//
// //////////////////////////////////////////////////////////////////////////////
import MediaElement from './mediaElement.js';

export default class RecorderEndpoint extends MediaElement {
  record() {
    return this.kws
      .invoke(this.id, 'record')
      .return('')
  }

  stopAndWait() {
    return this.kws
      .invoke(this.id, 'stopAndWait')
      .return('')
  }
}