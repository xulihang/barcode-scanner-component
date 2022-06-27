import { Component, h, Prop, State } from '@stencil/core';
import {default as BarcodeDetector} from "../../../node_modules/barcode-detection/dist/barcode-detector.esm.js"
import {DetectedBarcode, Point2D} from "barcode-detection"

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
  barcodeDetector:BarcodeDetector;
  interval:any;
  decoding:boolean = false;
  @State() viewBox: string = "0 0 1920 1080";
  @State() barcodeResults: DetectedBarcode[] = [];
  @Prop() license?: string;
  @Prop() drawOverlay?: boolean;
  @Prop() onScanned?: (results:DetectedBarcode[]) => void;

  async connectedCallback() {
    console.log("connected");
    let license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==";
    if (this.license) {
      console.log("using license: "+this.license);
      license = this.license;
    }
    console.log('Barcode Detector is not supported by this browser, using the Dynamsoft Barcode Reader polyfill.');

    //initialize the Dynamsoft Barcode Reader with a license
    BarcodeDetector.setDBRLicense(license);
    await BarcodeDetector.initDBR();
    this.barcodeDetector = new BarcodeDetector();
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
        const results = await this.barcodeDetector.detect(this.camera);
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
    let pThis = this;
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      pThis.localStream = stream;
      // Attach local stream to video element      
      pThis.camera.srcObject = stream;
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

  getPointsData = (tr:DetectedBarcode) => {
    const points:readonly Point2D[] = tr.cornerPoints;
    let pointsData = points[0].x + "," + points[0].y + " ";
    pointsData = pointsData + points[1].x + "," + points[1].y + " ";
    pointsData = pointsData + points[2].x + "," + points[2].x + " ";
    pointsData = pointsData + points[3].x + "," + points[3].x;
    return pointsData;
  }

  renderSVGOverlay(){
    if (this.drawOverlay === true) {
      return (
        <svg 
        viewBox={this.viewBox}
        xmlns="<http://www.w3.org/2000/svg>"
        class="overlay fullscreen">
        {this.barcodeResults.map((tr,idx) => (
          <polygon key={"poly-"+idx} xmlns="<http://www.w3.org/2000/svg>"
          points={this.getPointsData(tr)}
          class="barcode-polygon"
          />
        ))}
        {this.barcodeResults.map((tr,idx) => (
          <text key={"text-"+idx} xmlns="<http://www.w3.org/2000/svg>"
          x={tr.cornerPoints[0].x.toFixed(0)}
          y={tr.cornerPoints[0].y.toFixed(0)}
          fill="red"
          font-size="20"
          >{tr.rawValue}</text>
        ))}
      </svg>
      )
    }
  }

  render() {
    return (
      <div class="scanner" ref={(el) => this.scanner = el}>
        <select onChange={() => this.onCameraChanged()}  id="cameraSelect" ref={(el) => this.cameraSelect = el as HTMLSelectElement}></select>
        <button onClick={() => this.close()} id="closeButton">Close</button>
        {this.renderSVGOverlay()}
        <video class="camera fullscreen" ref={(el) => this.camera = el as HTMLVideoElement} onLoadedData={()=>this.onCameraOpened()} muted autoplay="autoplay" playsinline="playsinline" webkit-playsinline></video>
      </div>
    );
  }

}
