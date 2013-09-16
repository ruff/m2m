var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = 8080;

var root = 'http://att-api.m2m.io/2';
var user = 'asoncodi@gmail.com';
var pass = '';

var Client = require('node-rest-client').Client;

var client = new Client({
  user: user,
  password: pass
});

var temp = [];
var moisture = [];
var light = [];

setInterval(function() {
  client.get(root +
    '/account/domain/1ce215c3f9414890642cbc67595780a7' +
    '/stuff/arduino/thing/device02/present', function(data, response) {
    if (!data.attributes) {
      return;
    }

    var t = parseFloat(data.attributes.Temperature) || 0;
    var m = parseFloat(data.attributes.Moisture) || 0;
    var l = parseFloat(data.attributes.Light) || 0;

    if (temp.length > 9) {
      temp.pop();
      moisture.pop();
      light.pop();
    }

    temp.push(t);
    moisture.push(m);
    light.push(l);
  });
}, 1000);

app.use(express.static(__dirname + '/www'));

app.get('*', function(req, res) {
  return res.sendfile(__dirname + '/www/index.html');
});

io.sockets.on('connection', function(socket) {
  socket.on('ping', function(data) {
    console.log(data);

    socket.emit('pong', {
      pong: new Date()
    });
  });

  var pushInterval = setInterval(function() {
    socket.emit('push', {
      temp: temp,
      moisture: moisture,
      light: light
    });
  }, 2000);

  socket.on('disconnect', function() {
    console.log('client disconnected');
    if (pushInterval) {
      clearInterval(pushInterval);
    }
  });
});

server.listen(port, function() {
  console.log('up on %d', port);
});
