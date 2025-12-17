const app = getApp()
Page({
  data: {
    avatarUrl: '',
    nickName: ''
  },
  onLoad() {
    this.setData({
      avatarUrl: app.globalData.userInfo.avatarUrl || '',
      nickName: app.globalData.userInfo.nickName || ''
    })
  }
})