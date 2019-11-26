import { Component, OnInit } from '@angular/core';
import { ArasService } from '../services/aras.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  fileInfo;
  constructor(private service: ArasService) { }
  isFileSlected = false;
  isUploaded = false;
  uploadStatus = false;
  fileStaus;
  isValidFormat = false;
  ngOnInit() {
  }

  fileValidation(ele) {
    var alowedFormats = /(\.csv|\.txt)$/i;
    let files = ele.files;
    if (files.length) {
      this.fileInfo = files[0];
      if(!alowedFormats.exec(this.fileInfo.name)){
        ele.value = "";
        console.log('This file is not allowed, please upload valid file.');
        this.isValidFormat = true;
        return;
      }
      this.isValidFormat = false;
      this.isFileSlected = false;
    }
  }
  uploadFile(ele) {
    if (!this.fileInfo) {
      return this.isFileSlected = true;
    }
    // let formData = new FormData();
    // formData.append("uploads[]", this.fileInfo, this.fileInfo.name);
    this.isUploaded = true;
    this.service.upload_CSV_data(this.fileInfo.name).subscribe((res) => {
      this.fileStaus = res;
      console.log(res);
      this.isUploaded = false;
      this.uploadStatus = true;
      ele.value = "";
      setTimeout(() => {
        this.uploadStatus = true;
      }, 10000);
    }, (err) => {
      console.log(err);
      this.isUploaded = false;
    });
  }

}
