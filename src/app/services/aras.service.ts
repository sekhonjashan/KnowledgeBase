import {HttpClient} from '@angular/common/http'
import { Injectable } from '@angular/core';
@Injectable()
export class ArasService{

    constructor(private http : HttpClient){
        
    }

    upload_CSV_data(fileInfo){
        return this.http.post("http://localhost:4000/upload" , {params : {ra : fileInfo}} );
    }
}