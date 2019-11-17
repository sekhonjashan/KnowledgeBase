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
const tblnm = "R";
var csvfn = "files/sample.csv";
var dbcon = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "password",
      database: "test"
});


function intersection(o1, o2) {
    return Object.keys(o1).concat(Object.keys(o2)).sort().reduce(function (r, a, i, aa) {
        if (i && aa[i - 1] === a && a != "annotations") {
            r.push(a);
        }
        return r;
    }, []);
}
function raJoin(res) {
    var joinCollection = [];
    if (res.length > 1) {
        res[0].forEach((frItem, i) => {
            res[1].forEach((secItem, j) => {
                let flag = true;
                var similarProp = intersection(frItem, secItem);
                similarProp.forEach((val) => {
                    if (frItem[val] != secItem[val]) {
                        flag = false;
                    }
                })
                if (flag) {
                    var obj = { ...frItem, ...secItem };
                    obj['annotations'] = frItem['annotations'] * secItem['annotations'];
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
    console.log(res);
    var unionCollection = Object.assign([], res[0]);
    res[1].forEach((res) => {
        let idx = isAvailable(unionCollection, res);
        if (idx != -1) {
            unionCollection[idx]['annotations'] = parseInt(unionCollection[idx]['annotations']) + parseInt(res['annotations']);
        } else {
            unionCollection.push(res);
        }
    });
    console.log(unionCollection);
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
const getNumFruit = (sql) => {
    return selectCommand(sql).then((resp) => resp);
}

const forLoop = async (obj, req, res) => {
    var frt = Object.keys(obj);
    for (let index = 0; index < frt.length; index++) {
        let val = frt[index];
        if (obj[val].isApi && !obj[val].final && obj[val].symbol) {
            var nestedQuery = obj[val].value.split(obj[val].symbol);
            var results = [];
            for (let j = 0; j < nestedQuery.length; j++) {
                try {
                    sql = raToSql.getSql(nestedQuery[j]);
                    const numFruit = await getNumFruit(sql, j, nestedQuery);
                    results.push(numFruit)
                    if (j === nestedQuery.length - 1) {
                        if(obj[val].symbol == '⋈'){
                            obj[val].results = raJoin(results);
                        }else{
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
                        error: {
                            code: "Query is Invalid, Please Try with valid Relation Algebra Query"
                        }
                    })
                }
            }
        } else if(obj[val].isApi && !obj[val].final && !obj[val].symbol){
            sql = raToSql.getSql(obj[val].value);
            obj[val].results = await getNumFruit(sql)
            var message = await dataInsertion(val, obj[val].results);
            console.log(message);
        }else if (obj[val].final) {
            sql = raToSql.getSql(obj[val].value);
            const numFruit = await getNumFruit(sql);
            let temp = Object.assign([] , numFruit);
            let collection = [];
            temp.forEach((obj)=>{
                let idx = isAvailable(collection , obj);
                if(idx == -1){
                    collection.push(obj);
                }else{
                    collection[idx]['annotations'] = parseInt(collection[idx]['annotations']) + parseInt(obj["annotations"]);
                }
            });
            res.send(collection);
        } else {
            let nestedQuery = obj[val].value.split(obj[val].symbol);
            nestedQuery = nestedQuery.map((val) => {
                return val.replace(/\(|\)/g, '');
            });
            if(obj[val].symbol == '⋈'){
                obj[val].results = raJoin([obj[nestedQuery[0]].results, obj[nestedQuery[1]].results]);
            }else{
                obj[val].results = raUnion([obj[nestedQuery[0]].results, obj[nestedQuery[1]].results]);
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

function getMutiplicity(obj, req, res) {
    Object.keys(obj).forEach((val) => {
        var results = [];
        if (obj[val].isApi && !obj[val].final) {
            var nestedQuery = obj[val].value.split(obj[val].symbol);
            console.log(nestedQuery);
            nestedQuery.forEach(function (query, i) {
                try {
                    sql = raToSql.getSql(query);
                    if (!sql) {
                        res.send({
                            error: {
                                code: "Query is Invalid, Try with Valid Query"
                            }
                        })
                    }
                    selectCommand(sql).then((resp) => {
                        results.push(resp)
                        if (i === nestedQuery.length - 1) {
                            console.log(raJoin(results));
                        }
                    }, (err) => {
                        res.send({ error: err });
                    });
                }
                catch (ex) {
                    console.log(ex);
                    res.send({
                        error: {
                            code: "Please enter valid Relation Algebra Query"
                        }
                    })
                }

            });
        }
    });
}
aras.route('/mutliplicity').get(function (req, res) {
    let params = JSON.parse(req.query.ra);
    forLoop(params, req, res);
});
aras.route('/getQuery').get(function (req, res) {
    console.log(req.query.ra);
    // var sql = raToSql.getSql("π[studentName, subjectName](Subjects) U σ[a=10](A)");
    var sql, results = [];
    try {
        if (req.query.ra && typeof (req.query.ra) == 'string' && req.query.ra.toLowerCase() == 'getall') {
            sql = "SELECT * FROM R";
        } else {
            var nestedQuery = req.query.ra ? req.query.ra : [];
            nestedQuery.forEach(function (query, i) {
                sql = raToSql.getSql(query);
                if (!sql) {
                    res.send({
                        error: {
                            code: "Query is Invalid, Try with Valid Query"
                        }
                    })
                }

                selectCommand(sql).then((resp) => {
                    results.push(resp)
                    if (i === nestedQuery.length - 1) {
                        res.send(results);
                    }
                }, (err) => {
                    res.send({ error: err });
                });
            });
        }

    }
    catch (ex) {
        console.log(ex);
        res.send({
            error: {
                code: "Please enter valid Relation Algebra Query"
            }
        })
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
            res.send({ sucess: "Data Sucessfully uploaded" });
        })
        .catch(err => {
            res.send({ error: "Something went wrong" });
            console.error("err", err.stack);
        });

});
module.exports = aras;