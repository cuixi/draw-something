window.onload = function(){
	var username = document.querySelector('.username');
	var login = document.querySelector('.login');
	var loginModule = document.querySelector('.login_module');
	var paintering = document.querySelector('.painter_interface');
	var showPainter = document.querySelector('.painter');
	var photo = document.querySelector('.photo');


	/**
	 * 界面更新
	 */
	var interface = {
		init: function(){
			/**
			 * 用户登陆
			 */
			var self = this;
			login.addEventListener('click', this.login);
			username.addEventListener('keyup', function(e){
				if(e.keyCode == 13){
					self.login();
				}
			});			
		},
		login: function(){
			if(username.value){
				loginModule.style.display = 'none';
				game.login(username.value);
			}else{
				console.log('请输入昵称');
				username.focus();
			}
		}
	};


	/**
	 * 游戏连接及操作
	 */
	var game = {
		socket: null,
		player: null,
		playerList: [],
		getUid: function(){
			var uid = new Date().getTime() + '' + Math.floor(Math.random()*1000);
			return uid;
		},
		login: function(username){
			var self = this;
			var uid = this.getUid();
			this.player = {
				uid: uid,
				username: username
			};

			// 连接socket服务
			this.socket = io.connect(config.domain + ':' + config.port);

			// 登陆
			this.socket.on('login', function(data){
				self.player = data.player;
				self.playerList = data.playerList;
				if(self.player.master == 1){
					paintering.style.display = 'block';
				}
				if(self.player.guest == 1){
					showPainter.style.display = 'flex';
				}
				painter.init();

				// 绘图
				if(self.player && self.player.guest == 1){
					self.socket.on('painter', function(data){
						photo.src = data.img;
					});
				}
			});
			this.socket.emit('login', this.player);

			// 退出游戏
			this.socket.on('logout', function(data){
				console.log(data);
			});

		}
	}


	/**
	 * 绘图
	 */
	var painter = {
		init: function(){
			var canvas = document.querySelector('#canvas');
			var ctx = canvas.getContext('2d');

			this.painter(canvas, ctx);
			this.modifyParams(ctx);
			this.editPainter(ctx);
			if(game.player && game.player.master && game.player.master == 1){
				this.getPainter(canvas);
			}
		},
		/**
		 * 获取并传输绘制的图像
		 * 每隔60毫秒广播图像信息
		 * 设置消息类型为3
		 * @param  Object canvas    画布对象
		 */
		getPainter: function(canvas){
			setInterval(function(){
				var dataUrl = canvas.toDataURL();
				game.socket.emit('painter', {img: dataUrl});
			}, 60);
		},
		/**
		 * canvas绘制
		 * 画布绑定触摸事件，touchstart、touchmove、touchend
		 * @param  Object canvas 画布对象
		 * @param  Object ctx    canvas绘图环境
		 */
		painter: function(canvas, ctx){
			var isPaint = false;
			var offsetLeft = canvas.offsetLeft;
			var offsetTop = canvas.offsetTop;

			canvas.addEventListener('touchstart', function(e){
				var x = e.touches[0].clientX - offsetLeft;
				var y = e.touches[0].clientY - offsetTop;
				
				isPaint = true;
				ctx.beginPath();
				ctx.moveTo(x, y);
			});

			canvas.addEventListener('touchmove', function(e){
				var x = e.touches[0].clientX - offsetLeft;
				var y = e.touches[0].clientY - offsetTop;

				if(isPaint){
					ctx.lineTo(x, y);
					ctx.stroke();
				}
			});

			canvas.addEventListener('touchend', function(e){
				isPaint = false;
			});
		},
		/**
		 * 修改画笔大小
		 * 修改画笔颜色
		 * @param  Object ctx canvas绘图环境
		 */
		modifyParams: function(ctx){
			var colors = ['#f00', '#0f0', '#00f', '#000'];
			var widths = [1, 5, 10];
			ctx.strokeStyle = colors[3];
			/**
			 * 修改画笔大小
			 */
			var lineWidth = document.querySelector('.line_width');
			lineWidth.addEventListener('click', function(e){
				var index = e.target.getAttribute('data-index');
				ctx.lineWidth = widths[index];
			});

			/**
			 * 修改画笔颜色
			 */
			var lineColor = document.querySelector('.line_color');
			lineColor.addEventListener('click', function(e){
				var index = e.target.getAttribute('data-index');
				ctx.strokeStyle = colors[index];
			});
		},

		/**
		 * 选用绘制工具，橡皮擦、重新绘制
		 * @param  Object ctx canvas绘图环境
		 */
		editPainter: function(ctx){
			var clear = document.querySelector('.clear');
			var eraser = document.querySelector('.eraser');
			
			// 橡皮擦
			eraser.addEventListener('click', function(){
				var selected = eraser.classList.contains('active');
				if(selected){
					ctx.globalCompositeOperation = 'source-over';
				}else{
					ctx.globalCompositeOperation = 'destination-out';
				}
				eraser.classList.toggle('active');
			});

			// 重新绘制
			clear.addEventListener('click', function(){
				ctx.clearRect(0, 0, 300, 300);
			});
		}
	}

	interface.init();
}