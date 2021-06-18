// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-05-22 16:47:08
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-08-30 12:20:16
//  Description: saas-env
//
// //////////////////////////////////////////////////////////////////////////////

export default {
  KEY: process.env.KEY || '_%_|_%408_28*39_19^%SWIMS_|_%_',

  HOST: process.env.HOST || '0.0.0.0',
  PORT: process.env.PORT || 80,
  HEARTBEAT: process.env.HEARTBEAT || 3000,

  REGISTER: process.env.REGISTER || '',
  REGPORT: process.env.REGPORT || 6060,

  REPO: process.env.REPO || '/data',

  STUNPORT: process.env.STUNPORT || 3478
}