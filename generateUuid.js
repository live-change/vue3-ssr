const crypto = require('crypto')
function uuidFromBytes(rnd) {
  rnd[6] = (rnd[6] & 0x0f) | 0x40
  rnd[8] = (rnd[8] & 0x3f) | 0x80
  rnd = rnd.toString('hex').match(/(.{8})(.{4})(.{4})(.{4})(.{12})/)
  rnd.shift()
  return rnd.join('-')
}

function genUuid(callback) {
  if (typeof(callback) !== 'function') {
    return uuidFromBytes(crypto.randomBytes(16))
  }
  crypto.randomBytes(16, function(err, rnd) {
    if (err) return callback(err)
    callback(null, uuidFromBytes(rnd))
  })
}

module.exports = genUuid

