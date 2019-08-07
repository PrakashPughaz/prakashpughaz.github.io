let theStream = null;
let caputurer;
let currentFrame;
let currentRaqId;
let scale = 1.0;
let boundingBoxes;

let canvas = document.getElementById('myCanvas');    
canvas.onclick = (e) => {
  if(boundingBoxes) {    
    for(let box of boundingBoxes) {
      console.log(box.boundingBox);
      if(e.offsetX >= box.boundingBox.x && e.offsetX <= box.boundingBox.right && 
         e.offsetY >= box.boundingBox.y && e.offsetY <= box.boundingBox.bottom) {
        speechSynthesis.speak(new SpeechSynthesisUtterance(box.rawValue));
        break;
      }
    }
    boundingBoxes = undefined;
  }
  else {
    detect(currentFrame).then(blocks => {
      boundingBoxes = blocks;
    });
  }
};

function start() {
  // We want to select the environment-facing camera, but currently
  // that's not straightforward, instead, get the last enumerated one.
  navigator.mediaDevices.enumerateDevices()
  .then((devices) => {
    let thedevice;
    for(let device of devices) {
      if (device.kind == 'videoinput') {
        thedevice = navigator.mediaDevices.getUserMedia({
          "video": {
            deviceId: {exact : device.deviceId},
            width: { max: 640 }
          }
        });
      }
    }
    return thedevice;
  }) 
  .then(stream => {
    document.getElementById('video').src = stream;
    //document.getElementById('video').src = URL.createObjectURL(stream);
    document.getElementById('start').disabled = true;
    theStream = stream;
    capturer = new ImageCapture(theStream.getVideoTracks()[0]);
    process();
  })
  .catch(e => { console.error('getUserMedia() failed: ', e); });
}



function process() {
  currentRaqId = requestAnimationFrame(function() {
    capturer.grabFrame()
    .then(bitmap => {
      canvas.width = bitmap.width + 20;
      canvas.height = bitmap.height + 20;
      canvas.style.visibility = "visible";
      var ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 10, 10, bitmap.width, bitmap.height);
      scale = 1;
      
      currentFrame = bitmap;
      
      currentRaqId = requestAnimationFrame(process);
    });
  });
}


function detect(frame) {
    // Stop processing from the steam when trying to get the data.
    cancelAnimationFrame(currentRaqId);
    var textDetector = new TextDetector();
    return textDetector.detect(frame) 
      .then(textBlocks => {
                
        var ctx = canvas.getContext("2d");
        ctx.lineWidth = 2;
        ctx.strokeStyle = "red";

        for(var i = 0; i < textBlocks.length; i++) {
          const textBlock = textBlocks[i].boundingBox;
          ctx.rect(10 + Math.floor(textBlock.x * scale), 
                   10 + Math.floor(textBlock.y * scale),
                   Math.floor(textBlock.width * scale), 
                   Math.floor(textBlock.height * scale));
          ctx.stroke();          
        }
    
        return textBlocks;
      }).catch((e) => {        
        console.error("Boo, Text Detection failed: " + e);
        return [];
      });
}
