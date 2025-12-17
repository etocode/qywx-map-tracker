Page({
  data: {
    track: null,
    id: ''
  },
  onLoad(options) {
    this.setData({id: options.id})
    this.load()
  },
  load() {
    wx.cloud.database().collection('tracks').doc(this.data.id).get({
      success: r => {
        this.setData({track: r.data})
      }
    })
  },
  previewImg(e) {
    wx.previewImage({
      urls: [e.currentTarget.dataset.url]
    })
  },
  editPoint(e) {
    const idx = e.currentTarget.dataset.idx
    wx.chooseImage({
      count: 1,
      success: res => {
        wx.cloud.uploadFile({
          cloudPath: `trackImg/edit-${Date.now()}-${Math.floor(Math.random()*1000)}.jpg`,
          filePath: res.tempFilePaths[0],
          success: uploadRes => {
            let track = this.data.track
            track.points[idx].photoUrl = uploadRes.fileID
            wx.cloud.callFunction({
              name: 'updateTrackPoint',
              data: { id: this.data.id, idx, photoUrl: uploadRes.fileID },
              success: () => {
                this.load()
                wx.showToast({title:'更新成功'})
              }
            })
          }
        })
      }
    })
  },
  delPoint(e) {
    const idx = e.currentTarget.dataset.idx
    wx.showModal({
      title: '删除打点',
      content: '确认要删除该打点？',
      success: r => {
        if(r.confirm){
          wx.cloud.callFunction({
            name: 'updateTrackPoint',
            data: { id: this.data.id, idx, del: true },
            success: ()=>{
              this.load()
              wx.showToast({title:'已删除'})
            }
          })
        }
      }
    })
  },
  onShareAppMessage() {
    return {
      title: '我的户外轨迹',
      path: `/pages/track_detail/track_detail?id=${this.data.id}`
    }
  }
})