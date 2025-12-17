Page({
  data: {
    tracks: []
  },
  onShow() {
    this.loadTracks()
  },
  loadTracks() {
    wx.cloud.callFunction({
      name: 'getTracks',
      success: res => {
        this.setData({tracks: res.result.data||[]})
      }
    })
  },
  toDetail(e) {
    const idx = e.currentTarget.dataset.idx
    wx.navigateTo({
      url: `/pages/track_detail/track_detail?id=${this.data.tracks[idx]._id}`
    })
  },
  deleteTrack(e) {
    const idx = e.currentTarget.dataset.idx
    const id = this.data.tracks[idx]._id
    wx.showModal({
      content: '确定要删除这条轨迹吗？',
      success: r => {
        if(r.confirm){
          wx.cloud.callFunction({
            name: 'deleteTrack',
            data: { id },
            success: () => {
              wx.showToast({title: '已删除'})
              this.loadTracks()
            }
          })
        }
      }
    })
  }
})