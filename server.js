// 簡易Webサーバー
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');

var server = http.createServer(listener);

server.listen(80);
console.log('Server start');

function listener(req, res) {
  console.log(req);
  console.log(req.method);
  console.log(req.url);
  console.log(req.headers['user-agent']);
  
  var reqUrl = url.parse(req.url);
  console.log(reqUrl);
  var reqQuery = querystring.parse(reqUrl.query);
  console.log(reqQuery);

//  responseText(res);
  
//  responseHtmlFile(req, res);
  responsePngFile(req, res);
}

function responseText(res) {
  res.statusCode = 200;
  res.setHeader('Content-type', 'text/plain');
  res.write('Hello, node.js');
  res.end();
}

function responseHtmlFile(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-type', 'text/html');
  res.write(file('/hello.html'));
  res.end();
}

function responsePngFile(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-type', 'image/png');
  res.write(binaryFile('/hello.png'));
  res.end();
}

function file(filename) {
  return fs.readFileSync('contents' + filename);
}

function binaryFile(filename) {
  return fs.readFileSync('contents' + filename);
}
