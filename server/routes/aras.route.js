// import goes here
const express = require('express');
const app = express();
const aras = express.Router();
var raToSql = require('ra-to-sql');
const parse = require('csv-parse');
const util = require('util');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const async = require('async');
const csvHeaders = require('csv-headers');

// To create table in DB
const tblnm = "R";

// Static file path
var csvfn = "files/sample.csv";

//DB connection object
var dbcon = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "adminroot",
    database: "test"
});


aras.route('/getQuery').get(function (req, res) {
    console.log(req.query.ra);
    // var sql = raToSql.getSql("π[studentName, subjectName](Subjects) U σ[a=10](A)");
    var sql;
    try {
        if(req.query.ra && req.query.ra.toLowerCase() == 'getall'){
            sql = "SELECT * FROM R";
        }else{
        sql = raToSql.getSql(req.query.ra);
        }
        if (!sql) {
            res.send({
                error: {
                    code: "Query is Invalid, Try with Valid Query"
                }
            })
        }
        selectCommand(sql).then((resp) => {
            res.send({ query: resp });
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

// To check persistent DB connection
function connectionStatus(callback) {
    return new Promise((res, rej) => {
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
    console.log(sql , "*******");
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

// https://techsparx.com/nodejs/howto/csv2mysql.html

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
                        hdr = "Dummy"
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