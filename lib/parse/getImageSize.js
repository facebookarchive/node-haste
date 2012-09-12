/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

function gif(buffer) {
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8)
  };
}

function png(buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function jpeg(buffer) {
  var len = buffer.length;
  var offset = 2;
  while (offset < len) {
    var marker = buffer.readUInt16BE(offset);
    offset += 2;
    if (marker == 0xFFC0 || marker == 0xFFC2) {
      return {
        width: buffer.readUInt16BE(offset + 5),
        height: buffer.readUInt16BE(offset + 3)
      };
    } else {
      offset += buffer.readUInt16BE(offset);
    }
  }
  return null;
}

function getImageSize(buffer) {
  if (buffer[0] == 0xFF && buffer[1] == 0xD8) {
    return jpeg(buffer);
  } else if (buffer[0] == 0x47 && buffer[1] == 0x49 && buffer[2] == 0x46) {
    return gif(buffer);
  } else if (buffer[0] = 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E &&
    buffer[3] == 0x47) {
    return png(buffer);
  } else {
    return null;
  }
}

module.exports = getImageSize;
getImageSize.gif = gif;
getImageSize.png = png;
getImageSize.jpeg = jpeg;
