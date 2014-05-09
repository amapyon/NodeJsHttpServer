// 簡易Webサーバー
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');
var path = require('path');
var readline = require('readline');
var dateformat = require('dateformat');

var contentType = require('./content_type');
var MongoClient = require('mongodb').MongoClient;

var session = {params:{}};
var dbName = 'ranking';
var collectionName = 'kpt_ranking';

var server = http.createServer(listener);

server.on('error', defaultErrorHandler);
server.listen(8080);
console.log('Server start');

function listener(req, res) {
  console.log('=======================');
//  console.log(req);
  console.log(req.method);
  console.log(req.url);
  console.log(req.headers['user-agent']);
  
  var reqUrl = url.parse(req.url, true);
//  console.log(reqUrl);
  console.log(reqUrl.query);
  if (Object.keys(reqUrl.query).length > 0) {
    session.params = reqUrl.query;
  }
//  var reqQuery = querystring.parse(reqUrl.query);
//  console.log(reqQuery);
//  var basename = path.basename(reqUrl.pathname);
  var extname = path.extname(reqUrl.pathname);

//console.log(basename);
console.log(extname);
  
  switch (extname) {
  case '.html':
  case '.js':
    responseTextFile(req, res);
    break;
  case '.jss':
    responseJssFile(req, res);
    break;
  case '.png':
    responseBinFile(req, res);
    break;
  default:
    responseText(res);
  }

}

function getCurrentMonthFirstDay() {
  var today = new Date();
  return dateformat(new Date(today.getYear() + 1900, today.getMonth(), 1), 'yyyy/mm/dd');
}

function getCurrentMonthLastDay() {
  var today = new Date();
  return dateformat(new Date(today.getYear() + 1900, today.getMonth() + 1, 0), 'yyyy/mm/dd');
}

function getBegin() {
  if ('begin' in session.params) {
    return session.params.begin + ' 00:00';
  }
  return getCurrentMonthFirstDay() + ' 00:00';
}

function getEnd() {
  if ('end' in session.params) {
    return session.params.end + ' 23:50';
  }
  return getCurrentMonthLastDay() + ' 23:59';
}

function responseJssFile(req, res) {
  var itemIds = ['4799102753', 'B00EVHZPS0'];
  
  res.statusCode = 200;
  res.setHeader('Content-type', contentType.type['.jss']);

//  for (var i = itemIds.length - 1; i >= 0 ; i--) {
//    convertLogFileToArray(res, i, itemIds[i]);
//  }

  var begin = getBegin();
  var end = getEnd();
  convertLogDbToArray(res, itemIds, begin, end);
}

function convertLogDbToArray(res, itemIds, begin, end) {
  console.log(begin);
  console.log(end);

  MongoClient.connect('mongodb://localhost:27017/' + dbName, {native_parser:true}, function(err, db) {

    var x = [];
    var y0 = [];
    var y1 = [];
    db.collection(collectionName).find(
      {timestamp: {$gte: begin, $lte: end} }
    ).sort(
      {timestamp: 1}
    ).toArray(function(err, docs) {
//      console.log(docs);
      docs.forEach(function(doc) {
//        console.log(doc);
        x.push(doc['timestamp'].substring(5));
        y0.push(doc['4799102753']);
        y1.push(doc['B00EVHZPS0']);
      })
      res.write('var x=[\'' + x.join('\',\'') + '\'];\n');
      res.write('var y0=[' + y0.join(',') + '];\n');
      res.write('var y1=[' + y1.join(',') + '];\n');
      res.end();
      db.close();
      
    });
  })
}

function convertLogFileToArray(res, index, itemId) {
  var logFilename = '/home/masaru/ranking_history_' + itemId + '.log';
  var x = [];
  var y = [];

  logfs = fs.ReadStream(logFilename);
  rl = readline.createInterface({'input': logfs, 'output': {}});
  rl.on('line', function (line) {
//    console.log(line);
    lines = line.split("#");
    var ts = new Date(lines[0].trim());
    var rank = parseInt(lines[1].trim());
    ts = (ts.getMonth() + 1) + "/" + ts.getDate() + " " + ts.getHours() + ":" + ts.getMinutes();
    x.push(ts);
    y.push(rank);
  });
  rl.on('close', function () {
//    console.log(x);
//    console.log(y);
    res.write('var x' + index + ' = [\'');
    res.write(x.join('\',\''));
    res.write('\'];');
    res.write('\n');
    res.write('var y' + index + ' = [');
    res.write(y.join(','));
    res.write('];');
    res.write('\n');
    if (index == 0) {
      res.end();
    }
  });
}

function responseTextFile(req, res) {
  var reqUrl = url.parse(req.url);
  var reqQuery = querystring.parse(reqUrl.query);
  var basename = path.basename(reqUrl.pathname);
  var extname = path.extname(reqUrl.pathname);


  res.statusCode = 200;
  res.setHeader('Content-type', contentType.type[extname]);
  res.write(file(basename));
  res.end();
}

function responseBinFile(req, res) {
  responseTextFile(req, res);
}

function file(filename) {
  return fs.readFileSync('contents/' + filename);
}

function binaryFile(filename) {
  return fs.readFileSync('contents' + filename);
}

function responseText(res) {
  res.statusCode = 200;
  res.setHeader('Content-type', 'text/plain');
  res.write('Hello, node.js');
  res.end();
}

function defaultErrorHandler(error) {
  console.log(error);
}

