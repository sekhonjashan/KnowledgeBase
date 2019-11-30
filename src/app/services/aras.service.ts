import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core';
@Injectable()
export class ArasService {
    url: string = "http://localhost:4000";

    constructor(private http: HttpClient) {
    }
    /**
     * This method executes a GET API call for upload functionality
     * parameter is contains all the information about selected file 
     * @param fileInfo contains file information
     * @return return an Observable for asynchronus calling purpose
     */
    upload_CSV_data(fileInfo) {
        return this.http.post(this.url + "/upload", { params: { ra: fileInfo } });
    }

    /**
     * This method executes a POST API call for Relation Algebra Query evaluation
     * parameter is contains all the information about entered Relarional Algebra
     * @param obj contains query inforamtion
     * return an Observable for asynchronus calling purpose
     */
    op_mutliplicity(obj) {
        return this.http.get(this.url + "/provenance_semirings", { params: { ra: JSON.stringify(obj) } });
    }
}