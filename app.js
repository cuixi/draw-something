const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const hbs = require('express-handlebars');
const WebSocket = require('ws');
const config = require('./config');
const app = express();

/**
 * 中间件处理
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname + '/public')));

app.set('views', path.join(__dirname + '/views'));

app.engine('html', hbs());
app.set('view engine', '.html');

/**
 * 路由
 */
app.get('/', function(req, res){
	res.render('index');
});

app.get('/guess/:id', function(req, res){
	res.render('guess');
});

app.get('/painter/:id', function(req, res){
	res.render('painter');
});


// 启动本地node服务
const server = http.createServer(app);

server.listen(config.port, '0.0.0.0', function(err){
	if(err){
		console.log(err);
		return;
	}
	console.log('项目启动成功，监听 '+ config.port +' 端口...');
});


// 启动websocket服务
const wss = new WebSocket.Server({server: server});

const wsMap = {};
const wsRelaMap = {};


wss.on('connection', function(ws){
	const id = ws._ultron.id;
	wsMap[id] = ws;

	ws.on('message', function(data){
		console.log('接收消息：' + data);
		// 向所有客户端广播消息
		for(var id in wsMap){
			wsMap[id].send(data);
		}
	});

	ws.on('close', function(){
		delete wsMap[id];
		console.log('client is close');
	})
});


