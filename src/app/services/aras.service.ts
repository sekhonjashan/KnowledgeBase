import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core';
@Injectable()
export class ArasService {

    constructor(private http: HttpClient) {

    }
    // get_RA_Query(val){
    //     return this.http.get("http://localhost:4000/getQuery" ,{params : {ra : val}});
    // }

    upload_CSV_data(fileInfo) {
        return this.http.post("http://localhost:4000/upload", { params: { ra: fileInfo } });
    }

    op_mutliplicity(obj) {
        return this.http.get("http://localhost:4000/provenance_semirings", { params: { ra: JSON.stringify(obj) } });
    }
}