import { Component, h } from '@stencil/core';
import { BarcodeReader } from 'dynamsoft-javascript-barcode';

@Component({
  tag: 'barcode-scanner',
  styleUrl: 'barcode-scanner.css',
  shadow: true,
})
export class BarcodeScanner {

  scanner!: HTMLElement;
  localStream!: MediaStream;
  cameraSelect!: HTMLSelectElement;
  camera!: HTMLVideoElement;
  reader:BarcodeReader;
  interval:any;
  decoding:boolean = false;

  async connectedCallback() {
    console.log("connected");
    BarcodeReader.engineResourcePath = "https://cdn.jsdelivr.net/npm/dynamsoft-javascript-barcode@9.0.2/dist/";
    this.reader = await BarcodeReader.createInstance();
  }

  componentDidLoad(){
    this.loadDevicesAndPlay();
  }

  disconnectedCallback() {
    console.log("dis connected");
  }

  onCameraChanged(){
    var deviceId = this.cameraSelect.selectedOptions[0].value;
    this.play(deviceId);
  }

  onCameraOpened() {
    console.log("on opened");
    this.startDecoding();
  }

  startDecoding(){
    clearInterval(this.interval);
    this.decoding = false;
    const decode = async () => {
      if (this.decoding === false) {
        this.decoding = true;
        var results = await this.reader.decode(this.camera);
        this.decoding = false;
        console.log(results);
      }
    }
    this.interval = setInterval(decode, 500);
  }

  stopDecoding() {
    clearInterval(this.interval);
    this.decoding = false;
  }


  loadDevicesAndPlay(){
    console.log(this.cameraSelect);
    console.log(this.camera);
    var constraints = {video: true, audio: false};
    navigator.mediaDevices.getUserMedia(constraints).then(async stream => {
      this.localStream = stream;
      this.cameraSelect.innerHTML="";
      const devices = await navigator.mediaDevices.enumerateDevices();
      var count = 0;
      var cameraDevices = [];
      var defaultIndex = 0;
      for (var i=0;i<devices.length;i++){
          var device = devices[i];
          if (device.kind == 'videoinput'){
              cameraDevices.push(device);
              var label = device.label || `Camera ${count++}`;
              console.log(this.cameraSelect);
              console.log(label);
              this.cameraSelect.add(new Option(label,device.deviceId));
              if (label.toLowerCase().indexOf("back") != -1) { //select the back camera as the default
                defaultIndex = cameraDevices.length - 1;
              }
              if (label.toLowerCase().indexOf("founder") != -1) { //test desktop camera
                defaultIndex = cameraDevices.length - 1;
              }
          }
      }

      if (cameraDevices.length>0) {
        this.cameraSelect.selectedIndex = defaultIndex;
        this.play(cameraDevices[defaultIndex].deviceId);
      }else{
        alert("No camera detected.");
      }
    });
  }
  
  play(deviceId:string) {
    console.log("using device id: "+deviceId);
    stop(); // close before play
    var constraints = {};
  
    if (!!deviceId){
      constraints = {
        video: {deviceId: deviceId},
        audio: false
      }
    }else{
      constraints = {
        video: true,
        audio: false
      }
    }
    let global = this;
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      global.localStream = stream;
      // Attach local stream to video element      
      global.camera.srcObject = stream;
    }).catch(function(err) {
        console.error('getUserMediaError', err, err.stack);
        alert(err.message);
    });
  }
  
  stop () {
    try{
      if (this.localStream){
        this.localStream.getTracks().forEach(track => track.stop());
      }
      this.stopDecoding();
    } catch (e){
      alert(e.message);
    }
  };

  close () {
    this.stop();
    this.scanner.style.display = "none";
  };

  render() {
    return (
      <div class="scanner" ref={(el) => this.scanner = el}>
        <select onChange={() => this.onCameraChanged()}  id="cameraSelect" ref={(el) => this.cameraSelect = el as HTMLSelectElement}></select>
        <button onClick={() => this.close()} id="closeButton">Close</button>
        <svg class="overlay fullscreen"></svg>
        <video class="camera fullscreen" ref={(el) => this.camera = el as HTMLVideoElement} onLoadedData={()=>this.onCameraOpened()} muted autoplay="autoplay" playsinline="playsinline" webkit-playsinline></video>
      </div>
    );
  }

}
