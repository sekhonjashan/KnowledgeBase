import { Component, OnInit } from '@angular/core';
import { ArasService } from '../services/aras.service';

@Component({
  selector: 'app-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit {
  fileInfo;
  constructor(private service : ArasService) { }
  isFileSlected = false;
  isUploaded = false;
  uploadStatus = false;
  ngOnInit() {
  }

  handleFileInput(files){
    if(files.length){
      this.fileInfo = files[0];
      this.isFileSlected = false;
    }
  }
  uploadFile(){
    if(!this.fileInfo){
      return this.isFileSlected = true;
    }
    // let formData = new FormData();
    // formData.append("uploads[]", this.fileInfo, this.fileInfo.name);
    this.isUploaded = true;
    this.service.upload_CSV_data(this.fileInfo.name).subscribe((res)=>{
      console.log(res);
      this.isUploaded = false;
      this.uploadStatus = true;
      setTimeout(()=>{
        this.uploadStatus = false;
      }, 5000);
    });
  }

}
