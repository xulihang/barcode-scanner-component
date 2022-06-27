import { Component, EventEmitter, h, Prop, State, Event } from '@stencil/core';
import { BarcodeReader, TextResult } from 'dynamsoft-javascript-barcode';
import { LocalizationResult } from 'dynamsoft-javascript-barcode/dist/types/interface/localizationresult';

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
  @State() viewBox: string = "0 0 1920 1080";
  @State() barcodeResults: TextResult[] = [];
  @Prop() license!: string;
  @Prop() onScanned?: (results:TextResult[]) => void;

  async connectedCallback() {
    console.log("connected");
    BarcodeReader.engineResourcePath = "https://cdn.jsdelivr.net/npm/dynamsoft-javascript-barcode@9.0.2/dist/";
    if (this.license) {
      console.log("using license: "+this.license);
      BarcodeReader.license = this.license;
    }
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
    this.updateViewBox();
    this.startDecoding();
  }

  updateViewBox(){
    this.viewBox = "0 0 "+this.camera.videoWidth+" "+this.camera.videoHeight;
  }

  startDecoding(){
    clearInterval(this.interval);
    this.decoding = false;
    const decode = async () => {
      if (this.decoding === false) {
        this.decoding = true;
        const results = await this.reader.decode(this.camera);
        this.barcodeResults = results;
        if (this.onScanned) {
          this.onScanned(results);
        }
        this.decoding = false;    
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
    let self = this;
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      self.localStream = stream;
      // Attach local stream to video element      
      self.camera.srcObject = stream;
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

  getPointsData = (lr:LocalizationResult) => {
    let pointsData = lr.x1 + "," + lr.y1 + " ";
    pointsData = pointsData + lr.x2+ "," + lr.y2 + " ";
    pointsData = pointsData + lr.x3+ "," + lr.y3 + " ";
    pointsData = pointsData + lr.x4+ "," + lr.y4;
    return pointsData;
  }

  render() {
    return (
      <div class="scanner" ref={(el) => this.scanner = el}>
        <select onChange={() => this.onCameraChanged()}  id="cameraSelect" ref={(el) => this.cameraSelect = el as HTMLSelectElement}></select>
        <button onClick={() => this.close()} id="closeButton">Close</button>
        <svg 
          viewBox={this.viewBox}
          xmlns="<http://www.w3.org/2000/svg>"
          class="overlay fullscreen">
          {this.barcodeResults.map((tr,idx) => (
            <polygon key={"poly-"+idx} xmlns="<http://www.w3.org/2000/svg>"
            points={this.getPointsData(tr.localizationResult)}
            class="barcode-polygon"
            />
          ))}
          {this.barcodeResults.map((tr,idx) => (
            <text key={"text-"+idx} xmlns="<http://www.w3.org/2000/svg>"
            x={tr.localizationResult.x1}
            y={tr.localizationResult.y1}
            fill="red"
            font-size="20"
            >{tr.barcodeText}</text>
          ))}
        </svg>
        <video class="camera fullscreen" ref={(el) => this.camera = el as HTMLVideoElement} onLoadedData={()=>this.onCameraOpened()} muted autoplay="autoplay" playsinline="playsinline" webkit-playsinline></video>
      </div>
    );
  }

}
