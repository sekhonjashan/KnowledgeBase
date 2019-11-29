const express = require('express');
var raToSql = require('ra-to-sql');
const parse = require('csv-parse');
const util = require('util');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const async = require('async');
const csvHeaders = require('csv-headers');
const readline = require('readline');
const app = express();
const aras = express.Router();
let tblnm = "R";
var filePath = "files/sample.csv";
var dbcon = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "password",
    database: "test"
});
var tab_name = "multiplicity";
/**
 * Find common properties in two Objects
 * 
 * @param {Object} first The First Object
 * @param {Object} second The Second Object
 * @returns {Array}
 */
function commonProperties(first, second) {
    return Object.keys(first).concat(Object.keys(second)).sort().reduce(function (r, a, i, aa) {
        if (i && aa[i - 1] === a && a != "annotations") {
            r.push(a);
        }
        return r;
    }, []);
}
/**
 * Truth Table between two numbers (logicalConjunction)
 * 
 * @param {Number} p The P Number
 * @param {Number} q The Q Number
 * @returns {Boolean}
 */
function logicalConjunction(p, q) {
    if (+p && +q) {
        return 1;
    }
    return 0;
}
/**
 * Truth Table between two numbers (logicalDisjunction)
 * 
 * @param {Number} p The P Number
 * @param {Number} q The Q Number
 * @returns {Boolean}
 */
function logicalDisjunction(p, q) {
    if (+p || +q) {
        return 1;
    }
    return 0;
}
/**
 * Joining two array of Objects
 * 
 * @param {Array} first The First Array of Objects
 * @param {Array} second The Second Array of Objects
 * @returns {Array}
 */
function raJoin(first, second) {
    console.log(tab_name, 'joinnnnnnnnnnnnn');
    var joinCollection = [];
    first.forEach((frItem, i) => {
        second.forEach((secItem, j) => {
            let flag = true;
            var similarProp = commonProperties(frItem, secItem);
            similarProp.forEach((val) => {
                if (frItem[val] != secItem[val]) {
                    flag = false;
                }
            });
            if (flag) {
                var obj = { ...frItem, ...secItem };
                if (tab_name == 'multiplicity' || tab_name == 'probability' || tab_name == 'certainity1') {
                    let calu = frItem['annotations'] * secItem['annotations'];
                    obj['annotations'] = tab_name == 'multiplicity' ? calu : calu.toFixed(3);
                } else if (tab_name == 'standard') {
                    obj['annotations'] = logicalConjunction(frItem['annotations'], secItem['annotations']);
                } else if (tab_name == 'ploynomial') {
                    obj['annotations'] = (frItem['annotations'] + secItem['annotations']).split("").sort().join("");
                }
                else if (tab_name == 'certainity2') {
                    obj['annotations'] = Math.min(+frItem['annotations'], secItem['annotations']);
                }
                joinCollection.push(obj);
            }
        });
    });
    return joinCollection;
}
/**
 * Union two array of Objects
 * 
 * @param {Array} first The First Array of Objects
 * @param {Array} second The Second Array of Objects
 * @returns {Array}
 */
function raUnion(first, second) {
    console.log("unionnnnnnnnnnnnnnn");
    var unionCollection = Object.assign([], first);
    second.forEach((raData) => {
        let idx = containsObject(unionCollection, raData);
        if (idx != -1) {
            if (tab_name == 'multiplicity' || tab_name == 'probability' || tab_name == 'certainity1' || tab_name == 'certainity2') {
                let calu = parseInt(unionCollection[idx]['annotations']) + parseInt(raData['annotations']);
                unionCollection[idx]['annotations'] = tab_name == 'multiplicity' ? calu : calu.toFixed(3);
            } else if (tab_name == 'standard') {
                unionCollection[idx]['annotations'] = logicalDisjunction(parseInt(unionCollection[idx]['annotations']), parseInt(raData['annotations']));
            } else if (tab_name == 'ploynomial') {
                unionCollection[idx]['annotations'] = unionCollection[idx]['annotations'] + '+' + raData['annotations'];
                //console.log('And ', unionCollection[idx]['annotations'], raData['annotations']);
                // console.log(unionCollection[idx]['annotations'], raData['annotations']);
            }
        } else {
            unionCollection.push(raData);
        }
    });
    return unionCollection;
}
/**
 * Determine if an object already exists in an array
 * 
 * @param {Array} arr The arr Array
 * @param {Object} obj The obj Object
 * @returns {Boolean}
 */
function containsObject(arr, obj, multiOper) {
    let flag = -1;
    let matchedItems = [];
    arr.some(function (item, i) {
        var ct = 0
        Object.keys(item).some(function (it) {
            if (item[it] == obj[it] && it != 'annotations') {
                ct++;
            }
        });
        if (ct == (Object.keys(obj).length - 1)) {
            flag = i;
            if (multiOper) {
                matchedItems.push(flag);
            } else {
                return true;
            }
        }
    });
    return multiOper ? matchedItems : flag;
}
/**
 * Querying Data from a Single Table
 * 
 * @param {String} sql The Sql Statment String
 * @param {Object} obj The res Object(response Object)
 * @returns {Array} The data return from result table
 */
const getQueryData = (sql, res) => {
    sql = sql.replace(/0987654321/g, "_");
    return selectCommand(sql).then((resp) => resp, (err) => {
        console.log(err);
        res.send({
            message: err.code + " " + err.sqlMessage
        })
    });
}
function probability(data, isProbability) {
    let temp = []
    data.forEach((obj) => {
        if (!obj['checked']) {
            let matchedArray = containsObject(data, obj, true);
            let val;
            matchedArray.forEach((ele) => {
                if (val) {
                    if (isProbability) {
                        val = Math.max(val, +data[ele]['annotations']);
                    } else {
                        val *= (1 - +(data[ele]['annotations']));
                    }
                } else {
                    if (isProbability) {
                        val = +data[ele]['annotations'];
                    } else {
                        val = (1 - +(data[ele]['annotations']));
                    }
                }
                data[ele]['checked'] = true;
            });
            obj['annotations'] = isProbability ?  val.toFixed(3)  : (1 - val).toFixed(3);
            delete obj['checked'];
            temp.push(obj);
        }
    });
    return temp;
}
/**
 * Querying Data from a Single Table
 * 
 * @param {String} sql The Sql Statment String
 * @param {Object} obj The res Object(response Object)
 * @returns {Array} The data return from result table
 */
const nestedQueryEvaluation = async (res, nestedQuery, symbol, val) => {
    var results = [];
    for (let j = 0; j < nestedQuery.length; j++) {
        nestedQuery[j] = nestedQuery[j].indexOf('σ') != -1 ? nestedQuery[j].replace(/,annotations/gi, "") : nestedQuery[j];
        let sql = raToSql.getSql(nestedQuery[j]);
        const data = await getQueryData(sql, res);
        results.push(data);
    }
    let report;
    if (symbol) {
        if (tab_name == 'probability' || tab_name == 'certainity1' || tab_name == 'certainity2') {
            let flag = (tab_name == 'certainity1' || tab_name == 'certainity2') ? true : false;
            results[0] = probability(Object.assign([], results[0]), flag);
            results[1] = probability(Object.assign([], results[1]), flag);
        }
        report = (symbol == '⋈') ? raJoin(results[0], results[1]) : raUnion(results[0], results[1]);
    } else {
        report = results[0];
    }
    if (report && report.length) {
        var message = await dataInsertion(val, report);
    }
    return report;
}
const queryEvaluation = async (obj, req, res) => {
    var frt = Object.keys(obj);
    for (let index = 0; index < frt.length; index++) {
        try {
            let val = frt[index];
            var nestedQuery = obj[val].symbol ? obj[val].value.split(obj[val].symbol) : [obj[val].value];
            obj[val].results = await nestedQueryEvaluation(res, nestedQuery, obj[val].symbol, val);
            if (obj[val].final) {
                let temp = Object.assign([], obj[val].results);
                let collection = [];
                if (tab_name == 'multiplicity' || tab_name == 'standard' || tab_name == 'ploynomial') {
                    temp.forEach((obj) => {
                        let idx = containsObject(collection, obj);
                        if (idx == -1) {
                            collection.push(obj);
                        } else {
                            if (tab_name == 'multiplicity') {
                                collection[idx]['annotations'] = parseInt(collection[idx]['annotations']) + parseInt(obj['annotations']);
                            } else if (tab_name == 'standard') {
                                collection[idx]['annotations'] = logicalDisjunction(parseInt(collection[idx]['annotations']), parseInt(obj['annotations']));
                            } else if (tab_name == 'ploynomial') {
                                collection[idx]['annotations'] = collection[idx]['annotations'] + '+' + obj['annotations'];
                            }
                        }
                    });
                } else if (tab_name == 'probability' || tab_name == 'certainity1' || tab_name == 'certainity2') {
                    let flag = (tab_name == 'certainity1' || tab_name == 'certainity2') ? true : false;
                    collection = probability(temp , flag);
                } else if (tab_name == 'ploynomial') {
                    collection.forEach((col) => {
                        var ploy = {};
                        col['annotations'].split('+').forEach((prob) => {
                            ploy[prob] = !ploy[prob] ? 1 : (ploy[prob] + 1);
                        });
                        let keyVal = "";
                        Object.keys(ploy).forEach((str, ind) => {
                            let polyForm = (ploy[str]) > 1 ? ploy[str] + str : str;
                            keyVal = (ind == 0) ? polyForm : (keyVal + '+' + polyForm);
                        });
                        col['annotations'] = keyVal;
                    });
                }
                if (tab_name == 'standard') {
                    var colList = [];
                    collection.forEach((itm) => {
                        if (+itm['annotations'] == 1 || +itm['annotations'] > 0) {
                            colList.push(itm);
                        }
                    });
                    collection = colList;
                }
                res.send(collection);
            }
        } catch (ex) {
            res.send({
                message: "Query is Invalid, Please Try with valid Relation Algebra Query"
            });
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


aras.route('/provenance_semirings').get(function (req, res) {
    let params = JSON.parse(req.query.ra);
    tab_name = params['ratype'];
    try {
        let validQuery = raToSql.getSql(params.query);
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
    console.log('Query : ', sql);
    return new Promise((res, rej) => {
        connectionStatus().then(() => {
            dbcon.query(sql, function (err, result, fields) {
                if (err) {
                    rej(err);
                    console.log(err);
                }
                res(result);
            });
        }, (err) => {
            rej(err);
        });
    })

}
function csvFormatUpload(res, csvfn) {
    return new Promise((resolve, reject) => {
        csvHeaders({
            file: csvfn,
            delimiter: ','
        }, function (err, headers) {
            if (err) reject(err);
            else resolve({ headers });
        });
    }).then(context => {
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
            res.send({ message: "Data Sucessfully uploaded with file name " + tblnm });
        })
        .catch(err => {
            res.send({ message: (err.stack ? err.stack : "Something went wrong, Please Try Again") });
            console.error("err", err.stack);
        });

}
async function textFileUpload(res, data, tblnm) {
    try {
        await dataInsertion(tblnm, data);
        res.send({ message: "Data Sucessfully uploaded with file name " + tblnm });
    } catch (err) {
        res.send({ message: "Something went wrong, Please Try Again" });
    }

}
/**
 * https://usefulangle.com/post/95/nodejs-read-file-line-by-line
 */
aras.route('/upload').post(function (req, res) {
    let file = req.body.params.ra;
    if (file) {
        tblnm = file.split('.').slice(0, -1).join('.');
        tblnm = tblnm.replace(/[^A-Za-z0-9]/g, "");
    }
    filePath = 'files/' + req.body.params.ra;
    if (file.indexOf('.csv') != -1) {
        csvFormatUpload(res, filePath);
    } else {
        try {
            let rl = readline.createInterface({
                input: fs.createReadStream(filePath)
            });
            let line_no = false;
            let fileData = [];
            let objProp = [];
            rl.on('line', function (line) {
                let propColl = line.split(",").map(ln => {
                    return ln.trim();
                });
                if (!line_no && line) {
                    objProp = propColl;
                    line_no = true;
                } else {
                    let objData = {};
                    objProp.forEach((prop, ind) => {
                        objData[prop] = propColl[ind];
                    });
                    fileData.push(objData);
                }
            });
            rl.on('close', function (line) {
                textFileUpload(res, fileData, tblnm);
            });
        } catch (e) {
            console.log('Error:', e.stack);
        }
    }
});
module.exports = aras;