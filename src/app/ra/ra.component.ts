import { Component, OnInit, ElementRef } from '@angular/core';
import { ArasService } from '../services/aras.service'
import { async } from 'q';
@Component({
  selector: 'app-ra',
  templateUrl: './ra.component.html',
  styleUrls: ['./ra.component.css']
})
export class RAComponent implements OnInit {
  queryCollection = [];
  constructor(private service: ArasService) {
  }
  response = [];
  result  = [];
  responseOne = [];
  responseTwo = [];
  isFetching = false;
  initial;
  actaulData = [];
  ngOnInit() {
    this.initial = false;
    // this.service.get_RA_Query("getAll").subscribe((res) => {
    //   this.actaulData = [];
    //   this.isFetching = false;
    //   this.actaulData = res["query"] ? res["query"] : (res ? res : []);
    // });
  }
  // raProjection(query) {

  // }
  // raSelection(query) {

  // }
  // intersection(o1, o2) {
  //   return Object.keys(o1).concat(Object.keys(o2)).sort().reduce(function (r, a, i, aa) {
  //     if (i && aa[i - 1] === a && a != "annotations") {
  //       r.push(a);
  //     }
  //     return r;
  //   }, []);
  // }
  // raJoin(query) {
  //   return new Promise((reslove, reject) =>{
  //     var mapObj = {
  //       "[": "(",
  //       "]": ")",
  //       "<": "[",
  //       ">": ",annotations]",
  //     };
  //     query = query.map((val, i) => {
  //       return this.queryEvluation(val ,/\[|\]|<|>/gi, mapObj);;
  //     });
  //     this.service.get_RA_Query(query).subscribe((res) => {
  //       var joinCollection = [];
  //       res[0].forEach((frItem, i) => {
  //         res[1].forEach((secItem, j) => {
  //           let flag = true;
  //           var similarProp = this.intersection(frItem, secItem);
  //           similarProp.forEach((val) => {
  //             if (frItem[val] != secItem[val]) {
  //               flag = false;
  //             }
  //           })
  //           if (flag) {
  //             var obj = { ...frItem, ...secItem };
  //             obj['annotations'] = frItem['annotations'] * secItem['annotations'];
  //             joinCollection.push(obj);
  //           }
  //         });
  //       });
  //       reslove(joinCollection);
  //     });
  //   });
  //   //console.log(query[0] , query[1]);
  // }
  // raUnion(query) {
  //   console.log(query[0], query[1]);
  // }

  submitQuery(ele) {
    this.initial = true;
    if (ele.value) {
      this.buildValidQuery("("+ele.value+")");
      // this.isFetching = true;
      // var dummyQuery = "π<a,c>((π<a,b>(R) natjoin π<b,c>(R)) U (π<a,c>(R) natjoin π<b,c>(R)))";
      // if (ele.value.trim() != dummyQuery) {
      //   var ra_Query = this.buildValidQuery(ele.value);
      //   this.service.get_RA_Query(ra_Query).subscribe((res) => {
      //     this.response = [];
      //     this.isFetching = false;
      //     this.response = res["query"] ? res["query"] : (res ? res : []);
      //   });
      // } else {
      //   this.service.get_RA_Query(this.buildValidQuery("(π<a,b>(R) natjoin π<b,c>(R))")).subscribe((res) => {
      //     this.response = [];
      //     this.responseOne = [];
      //     //this.isFetching = false;
      //     this.responseOne = res["query"] ? res["query"] : (res ? res : []);
      //     this.service.get_RA_Query(this.buildValidQuery("(π<a,c>(R) natjoin π<b,c>(R))")).subscribe((res) => {
      //       this.responseTwo = [];
      //       // this.response = [];
      //       this.isFetching = false;
      //       this.responseTwo = res["query"] ? res["query"] : (res ? res : []);
      //       this.unionAlltheValues();
      //     });
      //   });

      // }
    }
  }
  // unionByFormula(parent, child, unionAll) {
  //   parent.forEach((valP) => {
  //     child.forEach((valC) => {
  //       let count = 0;
  //       for (let index in valC) {
  //         if (valC[index] == valP[index]) {
  //           count++;
  //         }
  //       }
  //       if (count == Object.keys(valC).length) {
  //         var temp = Object.assign({}, valP);
  //         let idx = this.isAvailable(unionAll, temp);
  //         if (idx == -1) {
  //           temp.count = 1;
  //           unionAll.push(temp);
  //         } else {
  //           unionAll[idx].count += 1;
  //         }
  //         //console.log(valC ,2);
  //       } else {
  //         var temp = Object.assign({}, valP);
  //         let idx = this.isAvailable(unionAll, temp);
  //         // if(this.isAvailable(unionAll , temp) == -1){
  //         //   temp.count = 1;
  //         //   unionAll.push(temp);
  //         // }
  //         if (idx == -1) {
  //           temp.count = 1;
  //           unionAll.push(temp);
  //         } else {
  //           unionAll[idx].count += 1;
  //         }
  //         //console.log(valC ,1);
  //       }
  //     });
  //   });
  // }
  // isAvailable(arr, obj) {
  //   let flag = -1;
  //   arr.forEach((item, i) => {
  //     var ct = 0
  //     Object.keys(item).forEach((it) => {
  //       if (item[it] == obj[it]) {
  //         ct++;
  //       }
  //     });
  //     if (ct == Object.keys(obj).length) {
  //       flag = i;
  //       return flag;
  //     }
  //   });
  //   return flag;
  // }
  // unionAlltheValues() {
  //   this.responseOne.forEach((val, i) => {
  //     val.count = 1;
  //   });
  //   var unionAll = Object.assign([], this.responseOne);
  //   this.responseTwo.forEach((item, i) => {
  //     var temp = Object.assign({}, item);
  //     let idx = this.isAvailable(unionAll, temp);
  //     if (idx == -1) {
  //       temp.count = 1;
  //       unionAll.push(temp);
  //     } else {
  //       unionAll[idx].count += 1;
  //     }
  //   });
  //   this.filedsEvaluation(unionAll);
  // }
  // filedsEvaluation(unionAll) {
  //   unionAll.forEach((pVal) => {
  //     pVal.Dummy = pVal.Dummy ? pVal.Dummy : 0;
  //     this.actaulData.forEach((cVal) => {
  //       let count = 0;
  //       for (let index in cVal) {
  //         var indeX = index.toLocaleLowerCase();
  //         if (cVal[index] == pVal[indeX] && indeX != 'dummy') {
  //           count++;
  //         }
  //       }
  //       if (count == Object.keys(cVal).length - 1) {
  //         for (var i = 0; i < pVal.count; i++) {
  //           let val = parseInt(cVal.Dummy) ? parseInt(cVal.Dummy) : 0;
  //           pVal.Dummy += val * val
  //         }
  //       } else if (count == Object.keys(cVal).length - 2) {
  //         let val = parseInt(cVal.Dummy) ? parseInt(cVal.Dummy) : 0;
  //         if (pVal.Dummy) {
  //           pVal.Dummy *= val;
  //         } else {
  //           pVal.Dummy = val;
  //         }
  //       }
  //     });
  //   });
  //   //this.response = unionAll;
  //   this.finalStatement(unionAll, ['a', 'c', 'Dummy']);

  // }

  // finalStatement(data, filedsCol) {
  //   data.forEach((itm) => {
  //     var obj = {};
  //     filedsCol.forEach((val) => {
  //       obj[val] = itm[val];
  //     });
  //     let index = this.response.findIndex((lt) => {
  //       return lt['a'] == obj['a'] && lt['c'] == obj['c'];
  //     })
  //     if (index == -1) {
  //       this.response.push(obj);
  //     } else {
  //       this.response[index]['Dummy'] += obj['Dummy'];
  //     }
  //   });
  // }
  queryEvluation(str , regx , mapObj){
    str = str.replace(regx, function (matched) {
      return mapObj[matched];
    });
    return str;
  }
  buildValidQuery(raQuery) {
    this.isFetching = true;
    var mapObj = {
      "project": "π",
      "select": "σ",
      "union": "∪",
      "U" : "∪",
      "natjoin": "⋈"
    };
    raQuery = this.queryEvluation(raQuery ,/project|select|union|natjoin|U/gi, mapObj);
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
    this.queryCollection.forEach(function(val , i){
      tableObj['table' + (i+1)] = {value : val};
    });
    Object.keys(tableObj).forEach((it ,j)=>{
      Object.keys(tableObj).forEach((itm ,k)=>{
        let start = tableObj[it].value, end= tableObj[itm].value;
      if(start != end && start.indexOf(end) != -1){
        tableObj[it].value = start.replace(end , itm);
        tableObj[it].combine = true;
      //  if(tableObj[it].tables){
      //   tableObj[it].tables.push(itm);
      //  }else{
      //   tableObj[it].tables = [itm];
      //  }
       if(Object.keys(tableObj).length == (j+1)){
        tableObj[it]['final'] = true;
       }
      }
    });
    });
    Object.keys(tableObj).forEach((val)=>{
       var mapObj = {
        "[": "(",
        "]": ")",
        "<": "[",
        ">": ",annotations]",
      };
      tableObj[val]['value'] = this.queryEvluation(tableObj[val]['value'] ,/\[|\]|<|>/gi, mapObj);
      tableObj[val]['isApi'] = tableObj[val]['value'].indexOf('π') != -1? true : false;
      tableObj[val]['symbol'] = tableObj[val]['value'].indexOf('⋈') != -1 ?  '⋈' : '';
      tableObj[val]['symbol'] = tableObj[val]['value'].indexOf('∪') != -1 ?  '∪' : tableObj[val]['symbol'];
      // if(tableObj[val]['value'].indexOf('π') != -1){
      //   if(tableObj[val]['value'].indexOf('⋈') != -1){
      //     tableObj[val]['symbol'] = '⋈';
      //   }else if(tableObj[val]['value'].indexOf('∪') != -1){
      //     tableObj[val]['symbol'] = '⋈';
      //   }
      // }else{
      //   if(tableObj[val]['value'].indexOf('⋈') != -1){
      //     tableObj[val]['symbol'] = '⋈';
      //   }else if(tableObj[val]['value'].indexOf('∪') != -1){
      //     tableObj[val]['symbol'] = '⋈';
      //   }
      // }
    });
    // var me = this;
    this.service.op_mutliplicity(tableObj).subscribe((res:[])=>{
      this.isFetching = false;
      this.response = res ? res : [];
      console.log(res);
      // this.response = [];
      // this.response = res;
    }, function(err){
      this.isFetching = false;
    });
    console.log(tableObj);

    // Object.keys(tableObj).forEach((key , index)=>{
    //   let obj = tableObj[key];
    //   if(obj.isApi){
    //     console.log(obj , 'api')
    //   }else{
    //     console.log(obj);
    //   }
    // })
    // "union": "∪",
    //   "natjoin": "⋈"
  //   console.log(this.queryCollection);
  //   var me = this;
  //   let queryReq = null;
  //   function  myAsyncFunction(){
  //     me.queryCollection.forEach((val, i)=>{
  //     if (val.indexOf('(') == -1 && val.indexOf(')') == -1) {
  //       if (val.indexOf('⋈') != -1) {
  //         var joins = val.split('⋈');
  //         if (joins.length > 1) {
  //           queryReq = (me.raJoin(joins));
  //           queryReq.then((data)=>{
  //             console.log(data);
  //           })
  //         }
  //       } if (val.indexOf('∪') != -1) {
  //         var unions = val.split('∪');
  //         if (unions.length > 1) {
  //           me.raUnion(unions);
  //         }
  //       }
  //     }
  //   });
  // }
  //myAsyncFunction();
    //return raQuery;
    //   var regex = /</gi;
    //   raQuery = raQuery.replace(regex, '[');
    //   regex = />/gi;
    //   raQuery = raQuery.replace(regex, ']');
    // if(raQuery.indexOf('project') != -1){
    //   regex = /project/gi;
    //   raQuery = raQuery.replace(regex, 'π');
    // }else  if(raQuery.indexOf('select') != -1){
    //   regex = /select/gi;
    //   raQuery = raQuery.replace(regex, 'σ');
    // }else  if(raQuery.indexOf('union') != -1){
    //   regex = /union/gi;
    //   raQuery = raQuery.replace(regex, '∪');
    // }else  if(raQuery.indexOf('natjoin') != -1){
    //   regex = /natjoin/gi;
    //   raQuery = raQuery.replace(regex, '⋈');
    // }

    console.log(raQuery);
    //     Projection: Proj[a,b](A), π[a,b](A)
    // Selection: Sel[Condition](A), σ[Condition](A)
    // Natural Join: A |x| B, A ⋈ B
    // Union: A U B, A ∪ B
  }
  getKeys(obj) {
    return Object.keys(obj).sort();
  }
}
