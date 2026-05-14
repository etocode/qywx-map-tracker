# qywx-map-tracker
企业微信地图轨迹记录小程序

## 功能简介

- 上班/下班打卡，自动采集 GPS 轨迹点（每5分钟）
- 拍照打点（自拍与标志性建筑合照）
- 轨迹列表查看、详情地图展示
- 早退限制：18:00 前无法下班打卡，点击 21 次后可进入手动轨迹编辑页面
- 云端存储（微信云开发）

## 快速开始

### 前置条件

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 开通 [微信云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)，获取云环境 ID

### 配置

1. 在 `track-app/miniprogram/app.js` 中，将 `wx.cloud.init` 的 `env` 字段替换为你自己的云环境 ID：
   ```js
   wx.cloud.init({ env: '你的云环境ID' })
   ```

2. 在微信云开发控制台创建以下云函数并分别部署：
   - `saveTrack`
   - `getTracks`
   - `deleteTrack`
   - `updateTrackPoint`

3. 在云开发数据库中创建集合 `tracks`。

### 运行

用微信开发者工具打开 `track-app` 目录，点击编译即可预览。
