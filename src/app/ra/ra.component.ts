import { Component, OnInit, ElementRef } from '@angular/core';
import { ArasService } from '../services/aras.service';
import { NgForm } from '@angular/forms';
@Component({
  selector: 'app-ra',
  templateUrl: './ra.component.html',
  styleUrls: ['./ra.component.css']
})
export class RAComponent implements OnInit {
  constructor(private service: ArasService) {
  }
  model: any = {
    ratype: 'multiplicity'
  };
  isImplemented = false;
  queryCollection = [];
  response = [];
  isFetching = false;
  isEmpty = false;
  noData = false;
  special_case = "0987654321";
  tbl_keys;
  ngOnInit() {
  }

  queryEvluation(str, regx, mapObj) {
    str = str.replace(regx, function (matched) {
      return mapObj[matched];
    });
    return str;
  }
  clear(ele) {
    ele.value = "";
    this.model = {
      ratype: 'multiplicity'
    };
    this.response = [];
    this.isImplemented = false;
    this.isFetching = false;
    this.isEmpty = false;
    this.noData = false;
    return;
  }
  submitQuery(ele) {
    console.log(this.model);
    this.response = [];
    this.isEmpty = false;
    this.noData = false;
    if ((this.model.ratype == 'multiplicity' || this.model.ratype == 'standard' || this.model.ratype == 'probability')) {
      this.isImplemented = false;
    } else {
      this.isImplemented = true;
      return;
    }
    if (!ele.value.length) {
      this.isEmpty = true;
      return;
    }
    var raQuery = "{" + ele.value + "}";
    this.isFetching = true;
    var mapObj = {
      "project": "π",
      "select": "σ",
      "union": "∪",
      //"U": "∪",
      "natjoin": "⋈",
      "_": this.special_case
    };
    raQuery = this.queryEvluation(raQuery, /project|select|union|natjoin|_/gi, mapObj);
    raQuery = raQuery.replace(/\s/g, '')
    var a = [];
    this.queryCollection = [];
    for (var i = 0; i < raQuery.length; i++) {
      if (raQuery.charAt(i) == '{') {
        a.push(i);
      }
      if (raQuery.charAt(i) == '}') {
        this.queryCollection.push(raQuery.substring(a.pop() + 1, i));
      }
    }
    function getIndex(arr, val) {
      let flt = false;
      let index = Object.keys(arr).findIndex((it) => {
        return arr[it]['value'] == val;
      });
      if (index != -1) {
        flt = true;
      }
      return flt;
    }
    let tableObj = {}
    this.queryCollection.forEach(function (val, i) {
      //if(!getIndex(tableObj ,val)){
      tableObj['table' + (i + 1)] = { value: val };
      //}
    });
    var tableObjCl = Object.assign({}, tableObj);
    Object.keys(tableObj).forEach((it, j) => {
      Object.keys(tableObj).forEach((itm, k) => {
        let start = tableObj[it].value, end = tableObjCl[itm].value;
        if (start != end && start.indexOf(end) != -1) {
          tableObj[it].value = start.split(end).join(itm);
          tableObj[it].combine = true;
          //  if(tableObj[it].tables){
          //   tableObj[it].tables.push(itm);
          //  }else{
          //   tableObj[it].tables = [itm];
          //  }
          if (Object.keys(tableObj).length == (j + 1)) {
            tableObj[it]['final'] = true;
          }
        } else if (Object.keys(tableObj).length == 1) {
          tableObj[it]['final'] = true;
        }
      });
    });
    let queryFormat = {
      // "[": "(",
      // "]": ")",
      "{": "(",
      "}": ")",
      // "@" : "(",
      // "#" : ')'
    };
    //raQuery = this.queryEvluation(raQuery, /\[|\]|{|}|@|#/gi, queryFormat);
    raQuery = this.queryEvluation(raQuery, /{|}/gi, queryFormat);
    Object.keys(tableObj).forEach((val) => {
      let mapObj = {
        "{": "(",
        "}": ")",
        //"{": "[",
        "]": ",annotations]",
        // "@" : "(",
        // "#" : ')'
      };
      tableObj[val]['value'] = this.queryEvluation(tableObj[val]['value'], /\]|{|}/gi, mapObj);
      // tableObj[val]['isApi'] = tableObj[val]['value'].indexOf('π') != -1 ? true : false;
      // tableObj[val]['isApi'] = tableObj[val]['value'].indexOf('σ') != -1 ? true : tableObj[val]['isApi'];
      tableObj[val]['symbol'] = tableObj[val]['value'].indexOf('⋈') != -1 ? '⋈' : '';
      tableObj[val]['symbol'] = tableObj[val]['value'].indexOf('∪') != -1 ? '∪' : tableObj[val]['symbol'];
    });
    if (Object.keys(tableObj).length == 1 && !tableObj["table1"].symbol.length) {
      // tableObj["table1"]["isApi"] = true;
      tableObj["table1"]['final'] = true;
    }
    var params = {
      query: raQuery,
      bodmas: tableObj,
      ratype: (this.model && this.model['ratype']) ? this.model['ratype'] : "multiplicity"
    }
    // var me = this;
    this.service.op_mutliplicity(params).subscribe((res: []) => {
      this.isFetching = false;
      this.response = res ? res : [];
      console.log(res);
      if (!this.response.length) {
        this.noData = true;
      }
      // this.response = [];
      // this.response = res;
    }, function (err) {
      this.isFetching = false;
    });
    console.log(tableObj);
  }
  getKeys(obj, flag) {
    if (flag) {
      let keys = [];
      this.response.forEach((val) => {
        keys = keys.concat(Object.keys(val));
      });
      this.tbl_keys = [...new Set(keys)];
      let idx = this.tbl_keys.indexOf('annotations');
      if (idx != -1) {
        let temp = this.tbl_keys[idx];
        this.tbl_keys.splice(idx, 1);
        this.tbl_keys.push(temp);
      }
    }
    return this.tbl_keys;
  }
}
