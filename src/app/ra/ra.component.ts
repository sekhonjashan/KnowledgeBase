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
  special_case = "0987654321";
  ngOnInit() {
  }

  queryEvluation(str, regx, mapObj) {
    str = str.replace(regx, function (matched) {
      return mapObj[matched];
    });
    return str;
  }
  submitQuery(ele) {
    console.log(this.model);
    this.response = [];
    this.isEmpty = false;
    if ((this.model.ratype == 'multiplicity' || this.model.ratype == 'standard')) {
      this.isImplemented = false;
    } else {
      this.isImplemented = true;
      return;
    }
    if (!ele.value.length) {
      this.isEmpty = true;
      return;
    }
    var raQuery = "(" + ele.value + ")";
    this.isFetching = true;
    var mapObj = {
      "project": "π",
      "select": "σ",
      "union": "∪",
      //"U": "∪",
      "natjoin": "⋈",
      "_": this.special_case
    };
    raQuery = this.queryEvluation(raQuery, /project|select|union|natjoin|∪|_/gi, mapObj);
    raQuery = raQuery.replace(/\s/g, '')
    var a = [];
    this.queryCollection = [];
    for (var i = 0; i < raQuery.length; i++) {
      if (raQuery.charAt(i) == '(') {
        a.push(i);
      }
      if (raQuery.charAt(i) == ')') {
        this.queryCollection.push(raQuery.substring(a.pop() + 1, i));
      }
    }
    let tableObj = {}
    this.queryCollection.forEach(function (val, i) {
      tableObj['table' + (i + 1)] = { value: val };
    });
    Object.keys(tableObj).forEach((it, j) => {
      Object.keys(tableObj).forEach((itm, k) => {
        let start = tableObj[it].value, end = tableObj[itm].value;
        if (start != end && start.indexOf(end) != -1) {
          tableObj[it].value = start.replace(end, itm);
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
      "[": "(",
      "]": ")",
      "{": "[",
      "}": "]",
    };
    raQuery = this.queryEvluation(raQuery, /\[|\]|{|}/gi, queryFormat);
    Object.keys(tableObj).forEach((val) => {
      let mapObj = {
        "[": "(",
        "]": ")",
        "{": "[",
        "}": ",annotations]",
      };
      tableObj[val]['value'] = this.queryEvluation(tableObj[val]['value'], /\[|\]|{|}/gi, mapObj);
      tableObj[val]['isApi'] = tableObj[val]['value'].indexOf('π') != -1 ? true : false;
      tableObj[val]['isApi'] = tableObj[val]['value'].indexOf('σ') != -1 ? true : tableObj[val]['isApi'];
      tableObj[val]['symbol'] = tableObj[val]['value'].indexOf('⋈') != -1 ? '⋈' : '';
      tableObj[val]['symbol'] = tableObj[val]['value'].indexOf('∪') != -1 ? '∪' : tableObj[val]['symbol'];
    });
    if (Object.keys(tableObj).length == 1 && !tableObj["table1"].symbol.length) {
      tableObj["table1"]["isApi"] = true;
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
      // this.response = [];
      // this.response = res;
    }, function (err) {
      this.isFetching = false;
    });
    console.log(tableObj);
  }
  getKeys(obj) {
    let fields = Object.keys(obj).sort();
    let idx = fields.indexOf('annotations');
    if (idx != -1) {
      let temp = fields[idx];
      fields.splice(idx, 1);
      fields.push(temp);
    }
    return fields;
  }
}
