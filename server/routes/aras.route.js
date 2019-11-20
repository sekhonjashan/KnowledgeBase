const express = require('express');
var raToSql = require('ra-to-sql');
const parse = require('csv-parse');
const util = require('util');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const async = require('async');
const csvHeaders = require('csv-headers');
const app = express();
const aras = express.Router();
let tblnm = "R";
var csvfn = "files/sample.csv";
var dbcon = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "password",
    database: "test"
});
var tab_name = "multiplicity";
function commonProperties(obj1, obj2) {
    return Object.keys(obj1).concat(Object.keys(obj2)).sort().reduce(function (r, a, i, aa) {
        if (i && aa[i - 1] === a && a != "annotations") {
            r.push(a);
        }
        return r;
    }, []);
}
function logicalConjunction(p, q) {
    console.log(+p, q, 'p,q');
    if (+p && +q) {
        return 1;
    }
    return 0;
}
function logicalDisjunction(p, q) {
    if (+p || +q) {
        return 1;
    }
    return 0;
}
function raJoin(res) {
    console.log(tab_name, 'logggggggggggggg');
    var joinCollection = [];
    if (res.length > 1) {
        res[0].forEach((frItem, i) => {
            res[1].forEach((secItem, j) => {
                let flag = true;
                var similarProp = commonProperties(frItem, secItem);
                similarProp.forEach((val) => {
                    if (frItem[val] != secItem[val]) {
                        flag = false;
                    }
                })
                if (flag) {
                    var obj = { ...frItem, ...secItem };
                    console.log(frItem['annotations'] , secItem['annotations']);
                    if (tab_name == 'multiplicity') {
                        obj['annotations'] = frItem['annotations'] * secItem['annotations'];
                    } else if (tab_name == 'standard') {
                        console.log(logicalConjunction(frItem['annotations'], secItem['annotations']));
                        obj['annotations'] = logicalConjunction(frItem['annotations'], secItem['annotations']);
                    }
                    joinCollection.push(obj);
                }
            });
        });
    }
    return joinCollection;
}

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

function raUnion(res) {
    console.log(res, 'jsjsjssjsjsjjsjsj');
    var unionCollection = Object.assign([], res[0]);
    res[1].forEach((raData) => {
        console.log(res[0]);
        let idx = isAvailable(unionCollection, raData);
        if (idx != -1) {
            if (tab_name == 'multiplicity') {
                unionCollection[idx]['annotations'] = parseInt(unionCollection[idx]['annotations']) + parseInt(raData['annotations']);
            } else if (tab_name == 'standard') {
                unionCollection[idx]['annotations'] = logicalDisjunction(parseInt(unionCollection[idx]['annotations']), parseInt(raData['annotations']));
            }
        } else {
            unionCollection.push(raData);
        }
    });
    return unionCollection;
}
function isAvailable(arr, obj) {
    let flag = -1;
    arr.forEach((item, i) => {
        var ct = 0
        Object.keys(item).forEach((it) => {
            if (item[it] == obj[it] && it != 'annotations') {
                ct++;
            }
        });
        if (ct == (Object.keys(obj).length - 1)) {
            flag = i;
            return flag;
        }
    });
    return flag;
}
const getQueryData = (sql, res) => {
    sql = sql.replace(/0987654321/g, "_");
    return selectCommand(sql).then((resp) => resp, (err) => {
        console.log(err);
        res.send({
            message: err.code + " " + err.sqlMessage
        })
    });
}
const queryEvaluation = async (obj, req, res) => {
    var frt = Object.keys(obj);
    for (let index = 0; index < frt.length; index++) {
        let val = frt[index];
        if (obj[val].isApi && !obj[val].final && obj[val].symbol) {
            var nestedQuery = obj[val].value.split(obj[val].symbol);
            var results = [];
            for (let j = 0; j < nestedQuery.length; j++) {
                try {
                    nestedQuery[j] = nestedQuery[j].indexOf('σ') != -1 ? nestedQuery[j].replace(/,annotations/gi, "") : nestedQuery[j];
                    let sql = raToSql.getSql(nestedQuery[j]);
                    const data = await getQueryData(sql, res);
                    results.push(data)
                    if (j === nestedQuery.length - 1) {
                        if (obj[val].symbol == '⋈') {
                            obj[val].results = raJoin(results);
                        } else {
                            obj[val].results = raUnion(results);
                        }
                        if (obj[val].results && obj[val].results.length) {
                            var message = await dataInsertion(val, obj[val].results);
                            console.log(message);
                        }
                    }
                    console.log(index, 'indexxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
                }
                catch (ex) {
                    console.log(ex);
                    res.send({
                        message: "Query is Invalid, Please Try with valid Relation Algebra Query"
                    });
                }
            }
        } else if (obj[val].isApi && !obj[val].final && !obj[val].symbol) {
            try {
                obj[val].value = obj[val].value.indexOf('σ') != -1 ? obj[val].value.replace(/,annotations/gi, "") : obj[val].value;
                sql = raToSql.getSql(obj[val].value);
                obj[val].results = await getQueryData(sql, res)
                var message = await dataInsertion(val, obj[val].results);
                console.log(message);
            } catch (ex) {
                console.log(ex);
                res.send({
                    message: "Query is Invalid, Please Try with valid Relation Algebra Query"
                });
            }
        } else if (obj[val].final) {
            try {
                console.log(obj[val].value, 'obj[val].value obj[val].value obj[val].value obj[val].value obj[val].value');
                let data;
                if (obj[val].value && (obj[val].value.indexOf('σ') != -1 || obj[val].value.indexOf('π') != -1) || (frt.length == 1 && (obj[val].value.indexOf('⋈') == -1 && obj[val].value.indexOf('∪') == -1))) {
                    obj[val].value = obj[val].value.indexOf('σ') != -1 ? obj[val].value.replace(/,annotations/gi, "") : obj[val].value;
                    sql = raToSql.getSql(obj[val].value);
                    data = await getQueryData(sql, res);
                } else {
                    let nestedQuery = obj[val].value.split(obj[val].symbol);
                    nestedQuery = nestedQuery.map((val) => {
                        return val.replace(/\(|\)/g, '');
                    });
                    console.log(nestedQuery,nestedQuery,nestedQuery,nestedQuery);
                    if (obj[val].symbol == '⋈' && obj[nestedQuery[0]] && obj[nestedQuery[0]].results) {
                        data = raJoin([obj[nestedQuery[0]].results, obj[nestedQuery[1]].results]);
                    } else if (obj[val].symbol == '∪' && obj[nestedQuery[0]] && obj[nestedQuery[0]].results) {
                        data = raUnion([obj[nestedQuery[0]].results, obj[nestedQuery[1]].results]);
                    } else {
                        let dataResult = [];
                        for(let m = 0; m < nestedQuery.length ; m++){
                        //nestedQuery.forEach((val) => {
                            let sql = raToSql.getSql(nestedQuery[m]);
                            const reslt = await getQueryData(sql, res);
                            dataResult.push(reslt)
                        //});
                        }
                        if(obj[val].symbol == '⋈'){
                            data = raJoin(dataResult);
                        }else{
                            data = raJoin(dataResult);
                        } 
                    }
                }
                let temp = Object.assign([], data);
                let collection = [];
                temp.forEach((obj) => {
                    let idx = isAvailable(collection, obj);
                    if (idx == -1) {
                        collection.push(obj);
                    } else {
                        collection[idx]['annotations'] = parseInt(collection[idx]['annotations']) + parseInt(obj["annotations"]);
                    }
                })
                res.send(data);
            } catch (ex) {
                console.log(ex);
                res.send({
                    message: "Query is Invalid, Please Try with valid Relation Algebra Query"
                });
            }
        } else {
            // let nestedQuery = obj[val].value.split(obj[val].symbol);
            // nestedQuery = nestedQuery.map((val) => {
            //     return val.replace(/\(|\)/g, '');
            // });
            // if (obj[val].symbol == '⋈') {
            //     obj[val].results = raJoin([obj[nestedQuery[0]].results, obj[nestedQuery[1]].results]);
            // } else {
            //     obj[val].results = raUnion([obj[nestedQuery[0]].results, obj[nestedQuery[1]].results]);
            // }

            let nestedQuery = obj[val].value.split(obj[val].symbol);
            nestedQuery = nestedQuery.map((val) => {
                return val.replace(/\(|\)/g, '');
            });
            console.log(nestedQuery,nestedQuery,nestedQuery,nestedQuery);
            if (obj[val].symbol == '⋈' && obj[nestedQuery[0]] && obj[nestedQuery[0]].results) {
                obj[val].results = raJoin([obj[nestedQuery[0]].results, obj[nestedQuery[1]].results]);
            } else if (obj[val].symbol == '∪' && obj[nestedQuery[0]] && obj[nestedQuery[0]].results) {
                obj[val].results = raUnion([obj[nestedQuery[0]].results, obj[nestedQuery[1]].results]);
            } else {
                let dataResult = [];
                for(let m = 0; m < nestedQuery.length ; m++){
                //nestedQuery.forEach((val) => {
                    let sql = raToSql.getSql(nestedQuery[m]);
                    const reslt = await getQueryData(sql, res);
                    dataResult.push(reslt)
                //});
                }
                if(obj[val].symbol == '⋈'){
                    obj[val].results = dataResult.length > 1 ? raJoin(dataResult) : dataResult[0];
                }else{
                    obj[val].results =  dataResult.length > 1 ? raJoin(dataResult) : dataResult[0];
                } 
            }
            if (obj[val].results && obj[val].results.length) {
                var message = await dataInsertion(val, obj[val].results);
                console.log(message);
            }
        }
    }

    function dataInsertion(tblnm, data) {
        console.log('insertion is started');
        console.log(tblnm, data);
        let fieldnms = Object.keys(data[0]).sort().join(",")
        let fields = Object.keys(data[0]).sort().map((rep) => {
            return rep + ' TEXT';
        });
        fields = fields.join(",");
        let values = [];
        data.forEach((obj) => {
            let arr = [];
            Object.keys(data[0]).sort().forEach((val) => {
                arr.push(obj[val]);
            });
            values.push(arr);
        });
        console.log(values);
        return new Promise((resolve, rej) => {
            let context = { db: dbcon };
            context.db.query(`DROP TABLE IF EXISTS ${tblnm}`,
                [],
                err => {
                    if (err) reject(err);
                    else resolve(context);
                })
        }).then(context => {
            return new Promise((resolve, rej) => {
                console.log(`CREATE TABLE IF NOT EXISTS ${tblnm}(${fields} )`);
                context.db.query(`CREATE TABLE IF NOT EXISTS ${tblnm}(${fields})`,
                    [],
                    err => {
                        if (err) rej(err);
                        else resolve(context);
                    });
            });
        }).then((context) => {
            return new Promise((resolve, rej) => {
                var sql = `INSERT INTO ${tblnm} ( ${fieldnms} ) VALUES ?`;
                context.db.query(sql, [values],
                    err => {
                        if (err) { console.error(err); }
                        else setTimeout(() => {
                            resolve(true);
                        });
                    });
            });
        }).catch((err) => {
            console.log(err);
        })
    }
    // Object.keys(obj).forEach((val) => {
    //     var results = [];
    //     if (obj[val].isApi && !obj[val].final) {
    //         var nestedQuery = obj[val].value.split(obj[val].symbol);
    //         console.log(nestedQuery);
    //         const numFruit = await getNumFruit(raToSql.getSql(nestedQuery[0]), i , nestedQuery);
    //         console.log(numFruit);
    //         // nestedQuery.forEach(function (query, i) {
    //         //     try {
    //         //         sql = raToSql.getSql(query);
    //         //         if (!sql) {
    //         //             res.send({
    //         //                 error: {
    //         //                     code: "Query is Invalid, Try with Valid Query"
    //         //                 }
    //         //             })
    //         //         }
    //         //         const numFruit = await getNumFruit(sql , i , nestedQuery);
    //         //         console.log(numFruit);
    //         //     }
    //         //     catch (ex) {
    //         //         console.log(ex);
    //         //         res.send({
    //         //             error: {
    //         //                 code: "Please enter valid Relation Algebra Query"
    //         //             }
    //         //         })
    //         //     }

    //         // });
    //     }
    // });
}

// function getMutiplicity(obj, req, res) {
//     Object.keys(obj).forEach((val) => {
//         var results = [];
//         if (obj[val].isApi && !obj[val].final) {
//             var nestedQuery = obj[val].value.split(obj[val].symbol);
//             console.log(nestedQuery);
//             nestedQuery.forEach(function (query, i) {
//                 try {
//                     sql = raToSql.getSql(query);
//                     if (!sql) {
//                         res.send({
//                                 message: "Query is Invalid, Try with Valid Query"
//                         })
//                     }
//                     selectCommand(sql).then((resp) => {
//                         results.push(resp)
//                         if (i === nestedQuery.length - 1) {
//                             console.log(raJoin(results));
//                         }
//                     }, (err) => {
//                         res.send({ message: err.code });
//                     });
//                 }
//                 catch (ex) {
//                     console.log(ex);
//                     res.send({
//                             message: "Please enter valid Relation Algebra Query"
//                     })
//                 }

//             });
//         }
//     });
// }
aras.route('/multiplicity').get(function (req, res) {
    let params = JSON.parse(req.query.ra);
    tab_name = params['ratype'];
    console.log(tab_name);
    try {
        console.log(params.query);
        let validQuery = raToSql.getSql(params.query);
        console.log(validQuery);
        if (validQuery) {
            queryEvaluation(params.bodmas, req, res);
        }
    } catch (err) {
        console.log(err);
        res.send({
            message: "Query is Invalid, Please Try with valid Relation Algebra Query"
        });
    }
});

function connectionStatus(callback) {
    return new Promise((res, rej) => {
        console.log(dbcon.state, 'dbcon.state');
        if (dbcon.state == 'authenticated') {
            res();
        } else {
            dbcon.connect(function (err) {
                if (err) {
                    console.log(err);
                    rej(err);
                }
                res();
            })
        }
    });
}
function selectCommand(sql) {
    var regex = /DISTINCT /gi;
    sql = sql.replace(regex, '');
    console.log(sql, "*******");
    return new Promise((res, rej) => {
        connectionStatus().then(() => {
            dbcon.query(sql, function (err, result, fields) {
                if (err) {
                    rej(err);
                    console.log(err);
                }
                res(result);
                console.log(sql);
            });
        }, (err) => {
            rej(err);
        });
    })

}
aras.route('/upload').post(function (req, res) {
    let file = req.body.params.ra;
    if (file) {
        tblnm = file.split('.').slice(0, -1).join('.');
    }
    csvfn = 'files/' + req.body.params.ra;
    return new Promise((resolve, reject) => {
        csvHeaders({
            file: csvfn,
            delimiter: ','
        }, function (err, headers) {
            if (err) reject(err);
            else resolve({ headers });
        });
    })
        .then(context => {
            return new Promise((resolve, reject) => {
                connectionStatus().then(() => {
                    context.db = dbcon;
                    resolve(context);
                }, (err) => {
                    console.error('error connecting: ' + err.stack);
                    reject(err);
                });
            })
        })
        .then(context => {
            return new Promise((resolve, reject) => {
                context.db.query(`DROP TABLE IF EXISTS ${tblnm}`,
                    [],
                    err => {
                        if (err) reject(err);
                        else resolve(context);
                    })
            });
        })
        .then(context => {
            return new Promise((resolve, reject) => {
                var fields = '';
                var fieldnms = '';
                var qs = '';
                context.headers.forEach(hdr => {
                    hdr = hdr.replace(' ', '_');
                    if (fields !== '') fields += ',';
                    if (fieldnms !== '') fieldnms += ','
                    if (qs !== '') qs += ',';
                    if (!hdr) {
                        hdr = "annotations"
                    }
                    fields += ` ${hdr} TEXT`;
                    fieldnms += ` ${hdr}`;
                    qs += ' ?';
                });
                context.qs = qs;
                context.fieldnms = fieldnms;
                console.log(`CREATE TABLE IF NOT EXISTS ${tblnm}(${fields} )`);
                context.db.query(`CREATE TABLE IF NOT EXISTS ${tblnm}(${fields})`,
                    [],
                    err => {
                        if (err) reject(err);
                        else resolve(context);
                    })
            });
        })
        .then(context => {
            return new Promise((resolve, reject) => {
                fs.createReadStream(csvfn).pipe(parse({
                    delimiter: ',',
                    columns: true,
                    relax_column_count: true
                }, (err, data) => {
                    if (err) return reject(err);
                    async.eachSeries(data, (datum, next) => {
                        // console.log(`about to run INSERT INTO ${tblnm} ( ${context.fieldnms} ) VALUES ( ${context.qs} )`);
                        var d = [];
                        try {
                            context.headers.forEach(hdr => {
                                // In some cases the data fields have embedded blanks,
                                // which must be trimmed off
                                let tp = datum[hdr].trim();
                                // For a field with an empty string, send NULL instead
                                d.push(tp === '' ? null : tp);
                            });
                        } catch (e) {
                            console.error(e.stack);
                        }
                        // console.log(`${d.length}: ${util.inspect(d)}`);
                        if (d.length > 0) {
                            context.db.query(`INSERT INTO ${tblnm} ( ${context.fieldnms} ) VALUES ( ${context.qs} )`, d,
                                err => {
                                    if (err) { console.error(err); next(err); }
                                    else setTimeout(() => { next(); });
                                });
                        } else { console.log(`empty row ${util.inspect(datum)} ${util.inspect(d)}`); next(); }
                    },
                        err => {
                            if (err) reject(err);
                            else resolve(context);
                        });
                }));
            });
        })
        .then(context => {
            //context.db.end();
            res.send({ message: "Data Sucessfully uploaded" });
        })
        .catch(err => {
            res.send({ message: (err.stack ? err.stack : "Something went wrong, Please Try Again") });
            console.error("err", err.stack);
        });

});
module.exports = aras;