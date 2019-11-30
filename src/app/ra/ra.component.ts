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
    ratype: 'multiplicity',
    certainity: 'certainity1'
  };
  //isImplemented = false;
  queryCollection = [];
  response = [];
  isFetching = false;
  isEmpty = false;
  noData = false;
  special_case = "0987654321";
  tbl_keys;
  ngOnInit() {
  }
  /**
   * This method performs a replace utiltiy operation and constrcuts a Relation algebra query which is suitable for ra-to-sql.
   * RegExp replace method is used to replace the selected string.
   * @param str entered Relational algebara query
   * @param regx Regexp for ra-to-sql libarary accepted format
   * @param mapObj object contains the replace experessions
   */
  replaceUtility(str, regx, mapObj) {
    str = str.replace(regx, function (matched) {
      return mapObj[matched];
    });
    return str;
  }
  /**
   * This method triggers clear functionality
   * restores application state to the initial state
   * clears the input field
   * @param ele refrence of HTML Element(inputtext box)
   */
  clear(ele) {
    ele.value = "";
    this.model = {
      ratype: 'multiplicity',
      certainity: 'certainity1'
    };
    this.response = [];
    //this.isImplemented = false;
    this.isFetching = false;
    this.isEmpty = false;
    this.noData = false;
    return;
  }

  /**
   * This method is executed whenever an action is performed on submit button.
   * validation will be triggered and checks whether query is entered or not. if not entered it throws a validation message
   * executes 'replaceUtility' for constructs sutiable input to ra-to-sql library for Relational Algebra query formation.
   * splits the entered query as small sub inner queries by based on '{' , '}' symbols positions and each inner query treated as a object
   * executes the GET API call for Relation Algebra Query evaluation
   * constructs an Object by combining all the inner query objects
   * @param ele refrence of HTML Element(inputtext box)
   * @returns retrieves the data from service
   */
  submitQuery(ele) {
    console.log(this.model);
    this.response = [];
    this.isEmpty = false;
    this.noData = false;
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
      "natjoin": "⋈",
      "_": this.special_case
    };
    raQuery = this.replaceUtility(raQuery, /project|select|union|natjoin|_/gi, mapObj);
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
          if (Object.keys(tableObj).length == (j + 1)) {
            tableObj[it]['final'] = true;
          }
        } else if (Object.keys(tableObj).length == 1) {
          tableObj[it]['final'] = true;
        }
      });
    });
    let queryFormat = {
      "{": "(",
      "}": ")"
    };
    raQuery = this.replaceUtility(raQuery, /{|}/gi, queryFormat);
    Object.keys(tableObj).forEach((val) => {
      let mapObj = {
        "{": "(",
        "}": ")",
        "]": ",annotation]"
      };
      tableObj[val]['value'] = this.replaceUtility(tableObj[val]['value'], /\]|{|}/gi, mapObj);
      tableObj[val]['symbol'] = tableObj[val]['value'].indexOf('⋈') != -1 ? '⋈' : '';
      tableObj[val]['symbol'] = tableObj[val]['value'].indexOf('∪') != -1 ? '∪' : tableObj[val]['symbol'];
    });
    if (Object.keys(tableObj).length == 1 && !tableObj["table1"].symbol.length) {
      tableObj["table1"]['final'] = true;
    }
    let selectedVal = (this.model && this.model['ratype']) ? this.model['ratype'] : "multiplicity";
    var params = {
      query: raQuery,
      bodmas: tableObj,
      ratype: (selectedVal == 'certainity') ? this.model['certainity'] : selectedVal
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
/**
 * This method is helps to show the data into web page
 * Sort functionality to result data which is retrived from database
 * 'annotation' property will be placed as the last item in sorted order.
 * @param obj 
 * @param flag 
 */
  getKeys(obj, flag) {
    if (flag) {
      let keys = [];
      this.response.forEach((val) => {
        keys = keys.concat(Object.keys(val));
      });
      this.tbl_keys = [...new Set(keys)];
      let idx = this.tbl_keys.indexOf('annotation');
      if (idx != -1) {
        let temp = this.tbl_keys[idx];
        this.tbl_keys.splice(idx, 1);
        this.tbl_keys.push(temp);
      }
    }
    return this.tbl_keys;
  }
}