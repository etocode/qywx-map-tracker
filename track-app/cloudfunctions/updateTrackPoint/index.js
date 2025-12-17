const cloud = require('wx-server-sdk')
cloud.init()
exports.main = async (event, context) => {
  const db = cloud.database()
  const track = await db.collection('tracks').doc(event.id).get()
  let points = track.data.points
  if(event.del){
    points.splice(event.idx,1)
  }else{
    points[event.idx].photoUrl = event.photoUrl
  }
  return db.collection('tracks').doc(event.id).update({
    data: { points }
  })
}