import { Component, OnInit, ElementRef } from '@angular/core';
import { ArasService } from '../services/aras.service'
//import { Duplex } from 'stream';
@Component({
  selector: 'app-ra',
  templateUrl: './ra.component.html',
  styleUrls: ['./ra.component.css']
})
export class RAComponent implements OnInit {

  constructor(private service: ArasService) {
  }
  response = [];
  responseOne = [];
  responseTwo = [];
  isFetching = false;
  initial;
  actaulData = [];
  ngOnInit() {
    this.initial = false;
    this.service.get_RA_Query("getAll").subscribe((res) => {
      this.actaulData = [];
      this.isFetching = false;
      this.actaulData = res["query"] ? res["query"] : (res ? res : []);
    });
  }
  submitQuery(ele) {
    this.initial = true;
    if (ele.value) {
      this.isFetching = true;
      var dummyQuery = "π<a,c>((π<a,b>(R) natjoin π<b,c>(R)) U (π<a,c>(R) natjoin π<b,c>(R)))";
      if (ele.value.trim() != dummyQuery) {
        var ra_Query = this.buildValidQuery(ele.value);
        this.service.get_RA_Query(ra_Query).subscribe((res) => {
          this.response = [];
          this.isFetching = false;
          this.response = res["query"] ? res["query"] : (res ? res : []);
        });
      } else {
        this.service.get_RA_Query(this.buildValidQuery("(π<a,b>(R) natjoin π<b,c>(R))")).subscribe((res) => {
          this.response = [];
          this.responseOne = [];
          //this.isFetching = false;
          this.responseOne = res["query"] ? res["query"] : (res ? res : []);
          this.service.get_RA_Query(this.buildValidQuery("(π<a,c>(R) natjoin π<b,c>(R))")).subscribe((res) => {
            this.responseTwo = [];
            // this.response = [];
            this.isFetching = false;
            this.responseTwo = res["query"] ? res["query"] : (res ? res : []);
            this.unionAlltheValues();
          });
        });

      }
    }
  }
 
  isAvailable(arr, obj) {
    let flag = -1;
    arr.forEach((item, i) => {
      var ct = 0
      Object.keys(item).forEach((it) => {
        if (item[it] == obj[it]) {
          ct++;
        }
      });
      if (ct == Object.keys(obj).length) {
        flag = i;
        return flag;
      }
    });
    return flag;
  }
  unionAlltheValues() {
    this.responseOne.forEach((val, i) => {
      val.count = 1;
    });
    var unionAll = Object.assign([], this.responseOne);
    this.responseTwo.forEach((item, i) => {
      var temp = Object.assign({}, item);
      let idx = this.isAvailable(unionAll, temp);
      if (idx == -1) {
        temp.count = 1;
        unionAll.push(temp);
      } else {
        unionAll[idx].count += 1;
      }
    });
    this.filedsEvaluation(unionAll);
  }
  filedsEvaluation(unionAll) {
    unionAll.forEach((pVal) => {
      pVal.Dummy = pVal.Dummy ? pVal.Dummy : 0;
      this.actaulData.forEach((cVal) => {
        let count = 0;
        for (let index in cVal) {
          var indeX = index.toLocaleLowerCase();
          if (cVal[index] == pVal[indeX] && indeX != 'dummy') {
            count++;
          }
        }
        if (count == Object.keys(cVal).length - 1) {
          for (var i = 0; i < pVal.count; i++) {
            let val = parseInt(cVal.Dummy) ? parseInt(cVal.Dummy) : 0;
            pVal.Dummy += val * val
          }
        } else if (count == Object.keys(cVal).length - 2) {
          let val = parseInt(cVal.Dummy) ? parseInt(cVal.Dummy) : 0;
          if (pVal.Dummy) {
            pVal.Dummy *= val;
          } else {
            pVal.Dummy = val;
          }
        }
      });
    });
    //this.response = unionAll;
    this.finalStatement(unionAll , ['a' , 'c', 'Dummy']);

  }

  finalStatement(data, filedsCol) {
      data.forEach((itm)=>{
        var obj ={};
        filedsCol.forEach((val)=>{
          obj[val] = itm[val];
        });
        let index = this.response.findIndex((lt)=>{
          return lt['a'] == obj['a'] && lt['c'] == obj['c'];
        })
        if(index == -1){
          this.response.push(obj);
        }else{
          this.response[index]['Dummy'] +=obj['Dummy']; 
        }
    });
  }
  buildValidQuery(raQuery) {
    var mapObj = {
      "project": "π",
      "select": "σ",
      "union": "∪",
      "natjoin": "⋈",
      "<": "[",
      ">": "]"
    };
    raQuery = raQuery.replace(/project|select|union|natjoin|\<|\>/gi, function (matched) {
      return mapObj[matched];
    });
    return raQuery;
    

    console.log(raQuery);
    
  }
  getKeys(obj) {
    return Object.keys(obj).sort();
  }
}
