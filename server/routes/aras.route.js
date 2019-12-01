/**
 * @description Annotated Relational Algebra System
 * @fileoverview Utilities for handling  file operations and retrive results from MySql database based on Relational Algebra.
 * @author Sadaf Najam
 * @year 2019
 */
const express = require('express');
/**
 * Relational Algebra parser and SQL converter
 * https://www.npmjs.com/package/ra-to-sql
 */
var raToSql = require('ra-to-sql');
const parse = require('csv-parse'); // https://www.npmjs.com/package/csv-parse
const util = require('util');
const fs = require('fs');
//const path = require('path');
const mysql = require('mysql');
const async = require('async');
const csvHeaders = require('csv-headers');
const readline = require('readline');
const aras = express.Router();
let tblnm = "R"; //static tabl name, name will be updated when upload operation occurs.
var filePath = "files/sample.csv"; //static file path for file upload operations
/**
 * @varible dbcon
 * Holds MYSQl configuration settings
 */
var dbcon = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "password",
    database: "test"
});

var tab_name = "multiplicity"; //static RA query operation selected as 'multiplicity', value will be updated
/**
 * #Retrive common properties in between two Objects (table join purpose)
 * excludes 'annoation' property while checking
 * @param {Object} first The First Object
 * @param {Object} second The Second Object
 * @returns {Array} an array contains matched properties
 */
function commonProperties(first, second) {
    return Object.keys(first).concat(Object.keys(second)).sort().reduce(function (r, a, i, aa) {
        if (i && aa[i - 1] === a && a != "annotation") {
            r.push(a);
        }
        return r;
    }, []);
}
/**
 * #Truth Table between two numbers (logicalConjunction)
 * @param {Number} p The P Number
 * @param {Number} q The Q Number
 * @returns {Boolean}
 */
function logicalConjunction(p, q) {
    if (p && q) {
        return 1;
    }
    return 0;
}
/**
 * #Truth Table between two numbers (logicalDisjunction)
 * @param {Number} p The P Number
 * @param {Number} q The Q Number
 * @returns {Boolean}
 */
function logicalDisjunction(p, q) {
    if (p || q) {
        return 1;
    }
    return 0;
}
/**
 *  #Joining two array of Objects
 *  performs an operation, based on selected RA feature in between the 'annotation'
 *  if selected RA feature is
 *  'multiplicity' Or 'probability' Or 'ConfidenceJoin' -> multiplication  between two annotations
 *  'standard' -> Truth Table between two annotations (logicalConjunction)
 *  'ploynomial' -> Multiplication of the two strings ,formatting nnotations like A*A = AA
 *  'Shiri Semantics' -> finding the minimum value between two annotations
 * 
 * @param {Array} first The First Array of Objects
 * @param {Array} second The Second Array of Objects
 * @returns {Array} Analog to SQL 'JOIN' for Javascript array of Objects
 */
function raJoin(first, second) {
    var joinCollection = [];
    first.forEach((firstItem, i) => {
        second.forEach((secondItem, j) => {
            let isJoinValid = true;
            var similarProp = commonProperties(firstItem, secondItem);
            similarProp.forEach((val) => {
                if (firstItem[val] != secondItem[val]) {
                    isJoinValid = false;
                }
            });
            if (isJoinValid) {
                var joinObj = { ...firstItem, ...secondItem };
                if (tab_name == 'multiplicity' || tab_name == 'probability' || tab_name == 'certainity1') {
                    let value = (+firstItem['annotation']) * (+secondItem['annotation']);
                    joinObj['annotation'] = (tab_name == 'multiplicity') ? value : value.toFixed(3);
                } else if (tab_name == 'standard') {
                    joinObj['annotation'] = logicalConjunction(+firstItem['annotation'], +secondItem['annotation']);
                } else if (tab_name == 'ploynomial') {
                    joinObj['annotation'] = (firstItem['annotation'] + secondItem['annotation']).split("").sort().join("");
                } else if (tab_name == 'certainity2') {
                    joinObj['annotation'] = Math.min(+firstItem['annotation'], +secondItem['annotation']);
                }
                joinCollection.push(joinObj);
            }
        });
    });
    return joinCollection;
}

/**
 *  #Union two array of Objects
 *  performs an operation, based on selected RA feature in between 'annotation' from collection
 *  if a selected RA feature is
 *  'multiplicity' Or 'probability' Or 'ConfidenceJoin' Or 'Shiri Semantics' -> Addition between two annotations
 *  'standard' -> Truth Table between two annotations (logicalDisjunction)
 *  'ploynomial' -> addition of two strings, annotation formation will be like A+A = A + A
 * 
 * @param {Array} first The First Array of Objects
 * @param {Array} second The Second Array of Objects
 * @returns {Array} Analog to SQL 'UNION' for Javascript array of Objects
 */
function raUnion(first, second) {
    console.log('union' , tab_name);
    console.log(first , second);
    var unionCollection = Object.assign([], first);
    second.forEach((secondItem) => {
        let idx = containsObject(unionCollection, secondItem);
        if (idx != -1) {
            let firstItem = unionCollection[idx]['annotation'];
            if (tab_name == 'multiplicity' || tab_name == 'probability' || tab_name == 'certainity1') {
                let value = (+firstItem) + (+secondItem['annotation']);
                unionCollection[idx]['annotation'] = (tab_name == 'multiplicity') ? value : value.toFixed(3);
            } else if (tab_name == 'standard') {
                unionCollection[idx]['annotation'] = logicalDisjunction(+firstItem, +secondItem['annotation']);
            } else if (tab_name == 'ploynomial') {
                unionCollection[idx]['annotation'] = (firstItem) + '+' + (secondItem['annotation']);
            }else if (tab_name == 'certainity2') {
                unionCollection[idx]['annotation'] = Math.min(+firstItem['annotation'], +secondItem['annotation']);
            }
        } else {
            unionCollection.push(secondItem);
        }
    });
    console.log(unionCollection);
    return unionCollection;
}


/**
 * #Determine if an object already exists in an array or not
 * if multiOper is true , it will return an Array of matched items or returns a boolean.
 * @param {Array} arr Object Collection
 * @param {Object} obj The object will be passe as a parameter for matching function
 * @param {Boolean} multiOper return type collection or boolean
 * @returns {Array} if multiOper is true
 * @returns {Array} if multiOper is false
 */
function containsObject(arr, obj, multiOper) {
    let flag = -1;
    let matchedItems = [];
    arr.some(function (item, i) {
        var ct = 0
        Object.keys(item).some(function (it) {
            if (item[it] == obj[it] && it != 'annotation') {
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
 * #Retrieves  Data from a Single Table
 * Projection Or Selection operations will be executed from here
 * @param {String} sql contains the sql query
 * @param {Object} obj HTTP Response Object hepls to send data to browser
 * @returns {Array} retrives the result from database
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
/**
 * #Performs Recursion operation for macthed Objects when 'isProbability' value is false
 * if 'isProbability' value is false
 *  1. Finding a matched list from collection of objects
 *  2. Recursion operation
 *  (1-p1)*(1-p2)*(1-p3).....................(1-pn)
 * 
 * if 'isProbability' value is true
 *  1. Finding Max annotation in list of collection objects
 *  2. Max(p1,p2,p3 .............pn)
 * 
 * @param {Array} data Collection of Objects
 * @param {Boolean} isProbability if value is 'true' Finding Max annotation Or Recursion operation will executed.
 * @returns {Array} returns the final result.
 */
function probability(data, isProbability) {
    let ObjectCollection = []
    data.forEach((obj) => {
        if (!obj['checked']) {
            let matchedArray = containsObject(data, obj, true);
            let val;
            matchedArray.forEach((ele) => {
                if (val) {
                    if (isProbability) {
                        val = Math.max(val, +data[ele]['annotation']);
                    } else {
                        val *= (1 - +(data[ele]['annotation']));
                    }
                } else {
                    if (isProbability) {
                        val = +data[ele]['annotation'];
                    } else {
                        val = (1 - +(data[ele]['annotation']));
                    }
                }
                data[ele]['checked'] = true;
            });
            obj['annotation'] = isProbability ? val.toFixed(3) : (1 - val).toFixed(3);
            delete obj['checked'];
            ObjectCollection.push(obj);
        }
    });
    return ObjectCollection;
}

/**
 * @async executes in  Asynchronous programming way 
 * @method
 * #This is a sub-function for 'queryEvaluation' function , peforms an inner query evaluation.
 * if any query contains the natjoin or union , those will be executed from here
 * @function {raJoin} executes from here.
 * @funciton {raUnion} executes from here.
 * Once an operation is completed either natjoin or union data insertion will be proceed by executes 'dataInsertion'
 * @funciton {dataInsertion} executes from here.
 * 
 * @param {Object} res HTTP Response Object hepls to send data to browser
 * @param {Array} nestedQuery foramed an array after split using ⋈ Or ∪
 * @param {String} symbol either ⋈ Or ∪
 * @param {String} val table name for data insertion
 */
const nestedQueryEvaluation = async (res, nestedQuery, symbol, val) => {
    var results = [];
    for (let j = 0; j < nestedQuery.length; j++) {
        nestedQuery[j] = nestedQuery[j].indexOf('σ') != -1 ? nestedQuery[j].replace(/,annotation/gi, "") : nestedQuery[j];
        let sql = raToSql.getSql(nestedQuery[j]);
        const data = await getQueryData(sql, res);
        results.push(data);
    }
    let report;
    console.log(symbol , 'symbol' , val);
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

/**
 * @async  executes in  Asynchronous programming way 
 * @method
 * #This function is a primary function for Relation Algebra evaluation
 * All Relation algebra operations are executed here such as selection , projection ,natjoin Or union.
 * collection of all small inner queries will be split and sends to perform query evaluation.
 * 'obj' parameter has a list of small inner queries.
 * each small inner query is an object and contains the below properties
 * Sample Query : π[a,c]({{π[a,b](R) ⋈ π[b,c](R)} ∪ {π[a,c](R) ⋈ π[b,c](R)}})
 * @property 'symbol' either ⋈ Or ∪ Or Empty("")
 * @property 'value' π Or selection (π[a,b](R) / π[a,c](R) ⋈ π[b,c](R))
 * @property 'final' if final statemnt th true or false 
 * 
 * looping through each list of inner query, than fetching the result from database and passing that result to the next iteration.
 * until recives the result form database iteration will be in hold state, this asynchronous is achieved by using @async @await features.
 * if final value is false executes the nestedQueryEvaluation function
 * if final value is true , procced to the next steps.
 * 'multiplicity' -> Addition of two annotations
 * 'probability' Or 'ConfidenceJoin' Or 'Shiri Semantics' -> executes 'probability' function
 * 'standard' -> Truth Table between two annotations (logicalDisjunction) and returns  which 'annotation' value is 1
 * 'ploynomial' -> Addition of two string annotations and return format will be like A+A = A + A 
 * And couting the matched annotations(pp+pp = 2pp).
 * 
 * @param {Object} obj conatins list of query objects in a object
 * @param {Object} res HTTP Response Object hepls to send data to browser
 */
const queryEvaluation = async (obj, res) => {
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
                                collection[idx]['annotation'] = (+collection[idx]['annotation']) + (+obj['annotation']);
                            } else if (tab_name == 'standard') {
                                collection[idx]['annotation'] = logicalDisjunction(+(collection[idx]['annotation']), (+obj['annotation']));
                            } else if (tab_name == 'ploynomial') {
                                collection[idx]['annotation'] = collection[idx]['annotation'] + '+' + obj['annotation'];
                            }
                        }
                    });
                } else if (tab_name == 'probability' || tab_name == 'certainity1' || tab_name == 'certainity2') {
                    let flag = (tab_name == 'certainity1' || tab_name == 'certainity2') ? true : false;
                    collection = probability(temp, flag);
                }
                if (tab_name == 'ploynomial') {
                    collection.forEach((col) => {
                        var ploy = {};
                        col['annotation'].split('+').forEach((prob) => {
                            ploy[prob] = !ploy[prob] ? 1 : (ploy[prob] + 1);
                        });
                        let keyVal = "";
                        Object.keys(ploy).forEach((str, ind) => {
                            let polyForm = (ploy[str]) > 1 ? ploy[str] + str : str;
                            keyVal = (ind == 0) ? polyForm : (keyVal + '+' + polyForm);
                        });
                        col['annotation'] = keyVal;
                    });
                }
                if (tab_name == 'standard') {
                    var colList = [];
                    collection.forEach((itm) => {
                        if (+itm['annotation'] == 1 || +itm['annotation'] > 0) {
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
/**
 * #This function helps to Insert the Data Into MySQL
 * a table have been created with 'tblnm' and start adding data into table.
 * Drop table if exists
 * Create table if not exists ${tblnm}(${fields} )
 * @param {String} tblnm 
 * @param {Array} data 
 * @returns Returns a promise
 */
function dataInsertion(tblnm, data) {
    //console.log('insertion is started');
    //console.log(tblnm, data);
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
/**
 * @method REST GET
 *  'GET' REST API to making get call from fron-end
 * @url '/provenance_semirings'
 * @param {Object} req HTTP Request object
 * @param {Object} res HTPP Response object
 * @returns always return Response object to send response the browser.
 */
aras.route('/provenance_semirings').get(function (req, res) {
    let params = JSON.parse(req.query.ra);
    tab_name = params['ratype'];
    try {
        let validQuery = raToSql.getSql(params.query);
        if (validQuery) {
            queryEvaluation(params.bodmas, res);
        }
    } catch (err) {
        console.log(err);
        res.send({
            message: "Query is Invalid, Please Try with valid Relation Algebra Query"
        });
    }
});
/**
 * #This function helps to checking the database connection status
 * if connection is valid connection state is 'authenticated'
 * Or else establish a new connection to the database
 * @return return the Promise
 */
function connectionStatus() {
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
/**
 * #This function helps toMakes a call to the database with given sql statement
 * 
 * @param {String} sql 
 * @returns returns the Promise
 */
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
/**
 * #This function helps to import CSV data into MySQL database
 * @link https://techsparx.com/nodejs/howto/csv2mysql.html
 * This function is structured as a Promise chain, allowing us to string together several asynchronous operations
 * 1.   csv-headers module to read the first line of the CSV
 * 2.   connect to the MySQL database
 * 3.   delete the table if it exists. The database connection is stored as context.db
 * 4.   process the CSV headers and construct a CREATE TABLE command.The field type assigned is TEXT. 
 *      If a particular column name has spaces in it, the space character is translated to _ so it works as a MySQL column name.
 * 5.   construct an Array containing the value for each column, because that's what is required by MySQL's query function
 * 6.   with INSERT INTO we list field names for which to insert values, and we give a matching list of ?'s as place-holders for the inserted values.
 * 
 * @param {Object} res HTTP Response object 
 * @param {String} csvfn file path (location of the file)
 * @returns returns a Promise
 */
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
    }).then(context => {
        return new Promise((resolve, reject) => {
            context.db.query(`DROP TABLE IF EXISTS ${tblnm}`,
                [],
                err => {
                    if (err) reject(err);
                    else resolve(context);
                })
        });
    }).then(context => {
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
                    hdr = "annotation"
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
    }).then(context => {
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
    }).then(context => {
        //context.db.end();
        res.send({ message: "Data Sucessfully uploaded with file name " + tblnm });
    }).catch(err => {
        res.send({ message: (err.stack ? err.stack : "Something went wrong, Please Try Again") });
        console.error("err", err.stack);
    });

}
/**
 * #This function helps to upload functionality of text formatted files
 * @param {Object} res HTTP Response Object
 * @param {Array} data colleciton object
 * @param {String} tblnm for creating a table with given data
 */
async function textFileUpload(res, data, tblnm) {
    try {
        await dataInsertion(tblnm, data);
        res.send({ message: "Data Sucessfully uploaded with file name " + tblnm });
    } catch (err) {
        res.send({ message: "Something went wrong, Please Try Again" });
    }

}
/**
 * @method REST POST
 *  'POST' REST API to making POST call from front-end
 *  Perfomrs file Upload
 *  if file format is 'CSV' then executes the csvFormatUpload
 *  Or file format is 'txt' then read a file, line by line, asynchronously stored as collecion
 *  and executes the textFileUpload
 *  read a file, line by line, asynchronously
 * @link https://usefulangle.com/post/95/nodejs-read-file-line-by-line
 * @url '/upload'
 * @param {Object} req HTTP Request object
 * @param {Object} res HTPP Response object
 * @returns always return Response object to send the response
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