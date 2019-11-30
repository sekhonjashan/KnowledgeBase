import { Component, OnInit } from '@angular/core';
import { ArasService } from '../services/aras.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  fileInfo;
  constructor(private service: ArasService) { }
  isFileSlected = false;
  isUploaded = false;
  uploadStatus = false;
  fileStaus;
  isValidFormat = false;
  /**
   * This method performs a file Validation operation i.e selected filed valid or not
   * if selected file is valid than validation will be skipped or else retruns a validation message
   * file allowed formats only .csv Or .txt
   * @param ele refrence of file upload HTML Element , return the list of files selected
   */
  fileValidation(ele) {
    var alowedFormats = /(\.csv|\.txt)$/i;
    let files = ele.files;
    if (files.length) {
      this.fileInfo = files[0];
      if (!alowedFormats.exec(this.fileInfo.name)) {
        this.isFileSlected = false;
        ele.value = "";
        console.log('This file is not allowed, please upload valid file.');
        this.isValidFormat = true;
        return;
      }
      this.isValidFormat = false;
      this.isFileSlected = false;
    }
  }
  /**
   * This method is executed whenever an action is performed on upload button.
   * validation will be triggered 
   * checks whether file is selected or not 
   * if a file is selected procced to next step or else throws a validation message.
   * executes the POST API call for file upload Operation by calling common service method(upload_CSV_data)
   * @param ele refrence of file upload HTML Element , return the list of files selected
   * @return upload status
   * if status is fails than throws a validation message or else success status will be shown in the web page
   */
  uploadFile(ele) {
    if(this.isValidFormat){
      return ;
    }
    if (!this.fileInfo || this.isValidFormat) {
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
      // setTimeout(() => {
      //   this.uploadStatus = false;
      // }, 10000);
    }, (err) => {
      console.log(err);
      this.isUploaded = false;
    });
  }

}
