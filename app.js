const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const hbs = require('express-handlebars');
const websocket = require('socket.io');
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
const io = websocket(server);

let room = 'game';
let playerList = [];
let gameList = [];

io.on('connection', function(socket){
	let player = '';
	let game = '';

	/**
	 * 用户登陆
	 */
	socket.on('login', function(data){
		if(playerList.length == 0){
			data['master'] = 1;
			data['guest'] = 0;
		}else{
			data['master'] = 0;
			data['guest'] = 1;
		}
		player = data;
		playerList.push(data);
		socket.join(room);
		socket.emit('login', {player: data});
		// io.sockets.in(room).emit('login', {playerList: playerList, player: data});
	});

	/**
	 * 监听图片绘制
	 */
	socket.on('painter', function(data){
		io.sockets.in(room).emit('painter', data);
	});

	/**
	 * 离开游戏
	 */
	socket.on('disconnect', function(){
		var index = playerList.indexOf(player);
		playerList.splice(index, 1);
		console.log(playerList);
		io.sockets.in(room).emit('logout', {playerList: playerList, player: player})
	});


});


