var app = new Vue({
	el: '#app',
	data: {
		canvas: {},
		context: {},
		keyboardRange: 36,
		keyboardFlag: [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
		defaultWidth: 640,
		beat: 4,
		width: 640,
		height: 900,
		color: '#4169E1',
		noteList: {},
		rectNum: 0,
		nowSelect: [],
		onPathNoteX: 0,
		beforePosition: {x:-1,y:-1},
		dragStatus: -1,
		draggingIndex: -1,
		relx: 0,
		rely: 0,
	},
	methods: {
		expandCanvas: function () {
			this.width += this.defaultWidth;
			this.canvas.width = this.width;
			this.drawDivider(this.beat);
			this.drawAllNote();
			return;
		},
		//指定の座標にあるノートを探索する(O(N))
		searchClickRect: function (mousex, mousey, checkNote=-1) {
			let ret = -1;
			for (let key in this.noteList) {
				if(key == checkNote)
					continue;
				if (this.noteList[key].rawX <= mousex && mousex < this.noteList[key].rawX + this.noteList[key].width &&
					this.noteList[key].rawY <= mousey && mousey < this.noteList[key].rawY + this.noteList[key].height) {
					ret = key;
					break;
				}
			}
			return ret;
		},
		//指定のノートと被っているノートを探す(O(N))
		searchOverlapNote: function(targetNote){
			let ret=-1;
			const targetXLeft = this.noteList[targetNote].rawX;
			const targetXRight = targetXLeft + this.noteList[targetNote].width;
			const targetY = this.noteList[targetNote].rawY;
			for(let key in this.noteList){
				if(key==targetNote)
					continue;
				if((targetY == this.noteList[key].rawY) &&
				   !((this.noteList[key].rawX+this.noteList[key].width <= targetXLeft) ||
					 (targetXRight <= this.noteList[key].rawX)
				   )
				){
					ret=key;
					break;
				}

			}
			return ret;
		},
		//同じy座標でexpandする方向の延長上にあるノートを探索する
		//mode=0...左方向への探索 mode=1...右方向への探索
		searchPathNote:function(sourceIndex,mode){
			const sourceY=this.noteList[sourceIndex].fixedY;
			let sourceX=this.noteList[sourceIndex].rawX;
			if(mode==1){
				sourceX+=this.noteList[sourceIndex].width;
				this.onPathNoteX=1e18; //仮の最大値
			}else{
				this.onPathNoteX=-1;
			}
			for(let key in this.noteList){
				if(key==sourceIndex)
					continue;
				if(this.noteList[key].fixedY==sourceY){
					if(mode==0 && this.noteList[key].rawX<sourceX){
						this.onPathNoteX=
						Math.max(this.noteList[key].rawX+this.noteList[key].width-1, this.onPathNoteX);
					}else if(mode==1 && sourceX<this.noteList[key].rawX){
						this.onPathNoteX=
						Math.min(this.noteList[key].rawX+1, this.onPathNoteX);
					}
				}
			}
			return;
		},
		//左のマウスボタンを押したときの処理
		//すでに配置した図形の範囲内でなければ図形を配置
		//範囲内ならドラッグ
		onMouseLeftDown: function (e) {
			//キャンバスの左上の座標を取得
			const offsetX = this.canvas.getBoundingClientRect().left;
			const offsetY = this.canvas.getBoundingClientRect().top;
			//マウスが押されたcanvas上の座標を取得
			const x = e.clientX - offsetX;
			const y = e.clientY - offsetY;
			const index = this.searchClickRect(x, y);
			if (index == -1) {
				//見つからなかったらノートの追加
				//もしくは矩形選択
				this.dragStatus = 0;
				this.relx = x;
				this.rely = y;
			} else {
				//ノートの移動か引き伸ばしかを判定する
				this.draggingIndex = index;
				this.relx = this.noteList[index].rawX - x;
				this.rely = this.noteList[index].rawY - y;
				const left = this.noteList[index].rawX + Math.max(10, this.noteList[index].width / 8);
				const right = (this.noteList[index].rawX + this.noteList[index].width)
					- Math.max(10, this.noteList[index].width / 8);
				//真ん中ならノートの移動
				if (left <= x && x <= right) {
					this.beforePosition=
					{x:this.noteList[index].rawX, y:this.noteList[index].rawY};
					this.dragStatus = 1;
				} else if (x < left) {
					//左側なら左へ引き伸ばし
					this.searchPathNote(index,0);
					this.dragStatus = 2;
				} else if (x > right) {
					//右側なら右へ引き伸ばし
					this.searchPathNote(index,1);
					this.dragStatus = 3;
				}
			}
			return;
		},
		//選択した図形をドラッグしているときの処理
		onDrag: function (e) {
			if (this.dragStatus == -1)
				return;
			//キャンバスの左上の座標を取得
			const offsetX = this.canvas.getBoundingClientRect().left;
			const offsetY = this.canvas.getBoundingClientRect().top;
			//マウスが押されたcanvas上の座標を取得
			const x = e.clientX - offsetX;
			const y = e.clientY - offsetY;
			switch (this.dragStatus) {
				case 0:
					//選択範囲を示す矩形を描画する
					this.drawAll();
					this.context.globalAlpha = 0.2;
					this.context.fillStyle = "#87cefa";
					this.context.fillRect(Math.min(this.relx, x), Math.min(this.rely, y),
						Math.abs(this.relx - x), Math.abs(this.rely - y));
					this.context.globalAlpha = 1.0;
					break;
				case 1:
					this.moveNote(x, y); break;
				case 2:
					this.extendNoteLeft(x, y); break;
				case 3:
					this.extendNoteRight(x, y); break;
			}
		},
		moveNote: function (x, y) {
			x += this.noteList[this.draggingIndex].width / 40 + this.relx;
			const h = this.height / this.keyboardRange;
			const noteSize = this.defaultWidth / this.beat;
			//キャンバス上の位置がマス目の中でどこに位置するかを調べる
			const RawX = Math.floor(x / noteSize) * noteSize;
			const RawY = Math.floor(y / h) * h;
			//マス目上に修正された座標を調べる
			const fixedX = RawX / (noteSize / (16 / this.beat));
			const fixedY = RawY / h;
			//fixedの位置が変わっていれば描画オブジェクトの位置を更新して描画
			if (!(fixedX == this.noteList[this.draggingIndex].fixedX &&
				fixedY == this.noteList[this.draggingIndex].fixedY)
			) {
				//移動量を求めておく
				const difx = RawX - this.noteList[this.draggingIndex].rawX;
				const dify = RawY - this.noteList[this.draggingIndex].rawY;
				this.noteList[this.draggingIndex].rawX = RawX;
				this.noteList[this.draggingIndex].rawY = RawY;
				this.noteList[this.draggingIndex].fixedX = fixedX;
				this.noteList[this.draggingIndex].fixedY = fixedY;
				if (this.noteList[this.draggingIndex].selected) {
					//選択された要素の場合、全ての要素を移動
					for (let i = 0; i < this.nowSelect.length; i++) {
						if (this.nowSelect[i] == this.draggingIndex)
							continue;
						this.noteList[this.nowSelect[i]].rawX += difx;
						this.noteList[this.nowSelect[i]].rawY += dify;
						//rawX, rawYからfixedX,fixedYを計算する 
						this.noteList[this.nowSelect[i]].fixedX =
							this.noteList[this.nowSelect[i]].rawX / (noteSize / (16 / this.beat));
						this.noteList[this.nowSelect[i]].fixedY =
							this.noteList[this.nowSelect[i]] / h;
					}
				}
				this.drawAll();
			}
		},
		extendNoteLeft: function (x, y) {
			//現在のマス目のサイズを調べる
			const noteSize = this.defaultWidth / this.beat;
			const h = this.height / this.keyboardRange;
			//右端は変わらないので右端を保持
			const right =
				this.noteList[this.draggingIndex].rawX + this.noteList[this.draggingIndex].width;
			//キャンバス上の位置がマス目の中でどの座標に位置するかを調べる
			const RawX = Math.floor(x / noteSize) * noteSize;
			//rawの情報からどのマス目かを調べる
			const fixedX = RawX / (noteSize / (16 / this.beat));
			//元のノートの右端より右に行っていない　かつ　onPathNoteXに到達していない　かつ
			//fixedXの位置が変わっていれば、描画オブジェクトの位置を更新して描画
			if (RawX < right && fixedX != this.noteList[this.draggingIndex].fixedX && RawX>this.onPathNoteX) {
				if (RawX < this.noteList[this.draggingIndex].rawX)
					this.noteList[this.draggingIndex].width += noteSize;
				else
					this.noteList[this.draggingIndex].width -= noteSize;
				this.noteList[this.draggingIndex].rawX = RawX;
				this.noteList[this.draggingIndex].fixedX = fixedX;
				this.drawAll();
			}
		},
		extendNoteRight: function (x, y) {
			//現在のマス目のサイズを調べる
			const noteSize = this.defaultWidth / this.beat;
			const h = this.height / this.keyboardRange;
			//左端は変わらない
			const left = this.noteList[this.draggingIndex].rawX;
			//右端も持つ
			const right = left + this.noteList[this.draggingIndex].width;
			const fixedRight = right / (noteSize / (16 / this.beat));
			//キャンバス上の位置がマス目の中でどの座標に位置するかを調べる
			const RawX = Math.floor(x / noteSize) * noteSize;
			//rawの情報からどのマス目かを調べる
			const fixedX = RawX / (noteSize / (16 / this.beat));
			//console.log(fixedRight + " " + fixedX);
			//左端より左に行っていない　かつ　
			//fixedXの位置が変わっていれば、描画オブジェクトの位置を更新して描画
			if (RawX > left && fixedX != fixedRight && RawX<this.onPathNoteX) {
				if (RawX > right)
					this.noteList[this.draggingIndex].width += noteSize;
				else
					this.noteList[this.draggingIndex].width -= noteSize;
				this.drawAll();
			}
		},
		//ドラッグの終了
		onMouseLeftUp: function (e) {
			if (this.dragStatus == 0) {
				//移動量がx,yともに10pxに満たなければノート配置
				//満たすなら矩形選択
				//キャンバスの左上の座標を取得
				const offsetX = this.canvas.getBoundingClientRect().left;
				const offsetY = this.canvas.getBoundingClientRect().top;
				//マウスが押されたcanvas上の座標を取得
				const x = e.clientX - offsetX;
				const y = e.clientY - offsetY;
				if (Math.abs(x - this.relx) < 5 && Math.abs(y - this.rely) < 5) {
					if (this.nowSelect.length == 0)
						this.addNote(e, this.color);
				} else {
					this.rectangleDeselect();
					this.rectangleSelect(Math.min(x, this.relx), Math.min(y, this.rely),
						Math.max(x, this.relx), Math.max(y, this.rely));
					this.dragStatus = -1;
					this.draggingIndex = -1;
					return;
				}
			}else if (this.nowSelect.length > 0 && this.dragStatus != 1) {
				//ノートの引き伸ばし
				//選択の解除を行う
				this.rectangleDeselect();
				this.drawAll();
			}else if(this.dragStatus == 1){
				//（選択した）ノートの移動
				this.checkOverlapNote();
				if(this.nowSelect.length > 0){
					this.rectangleDeselect();
				}
				this.drawAll();
			}
			this.dragStatus = -1;
			this.draggingIndex = -1;
		},
		//移動したノートについて、重なりを判定して描画
		//重なっていたら編集を差し戻す
		checkOverlapNote: function(){
			//矩形選択を挟まない場合
			if(this.nowSelect.length == 0){
				const res = this.searchOverlapNote(this.draggingIndex);
				if(res!=-1){
					//被っていたら編集を差し戻す
					this.noteList[this.draggingIndex].rawX=this.beforePosition.x;
					this.noteList[this.draggingIndex].rawY=this.beforePosition.y;
					console.log("Error: Note already exists at destination");
				}
			}else{
				//矩形選択を挟む場合
				const difX=this.noteList[this.draggingIndex].rawX-this.beforePosition.x;
				const difY=this.noteList[this.draggingIndex].rawY-this.beforePosition.y;
				let res=true;
				for(let i=0;i<this.nowSelect.length;i++){
					if(this.searchOverlapNote(this.nowSelect[i])!=-1){
						res=false;
						break;
					}
				}
				if(!res){
					//ひとつでも被っていたら編集を差し戻す
					console.log("Error: Note already exists at destination");
					for(let i=0;i<this.nowSelect.length;i++){
						this.noteList[this.nowSelect[i]].rawX-=difX;
						this.noteList[this.nowSelect[i]].rawY-=difY;
					}
				}
			}
		},
		//矩形選択
		rectangleSelect: function (minx, miny, maxx, maxy) {
			//すべてのノートについて調べる(O(N))
			for (const key in this.noteList) {
				if (!((this.noteList[key].rawX + this.noteList[key].width < minx) ||
					(this.noteList[key].rawX > maxx) ||
					(this.noteList[key].rawY + this.noteList[key].height < miny) ||
					(this.noteList[key].rawY > maxy)
				)
				) {
					this.nowSelect.push(key);
					this.noteList[key].selected = true;
				}
			}
			this.drawAll();
		},
		//矩形選択の解除
		rectangleDeselect: function () {
			for (let i = 0; i < this.nowSelect.length; i++) {
				if (this.nowSelect[i] in this.noteList)
					this.noteList[this.nowSelect[i]].selected = false;
			}
			this.nowSelect.length = 0;
			return;
		},
		//右クリックしたときの処理
		//クリックした場所が長方形の範囲内なら消す
		//重なっている場合はひとつだけ消す
		onMouseRightDown: function (e) {
			//キャンバスの左上の座標を取得
			const offsetX = this.canvas.getBoundingClientRect().left;
			const offsetY = this.canvas.getBoundingClientRect().top;
			//マウスが押されたcanvas上の座標を取得
			const x = e.clientX - offsetX;
			const y = e.clientY - offsetY;
			const index = this.searchClickRect(x, y);
			if (index != -1) {
				//選択されてない場合は普通に削除
				if (!this.noteList[index].selected)
					delete (this.noteList[index]);
				else {
					//選択されている場合は選択したものまとめて削除
					for (let i = 0; i < this.nowSelect.length; i++) {
						delete (this.noteList[this.nowSelect[i]]);
					}
				}
			}
			this.rectangleDeselect();
			this.drawAll();
			return;
		},
		//クリックした座標に長方形を追加
		addNote: function (e, color) {
			let x = e.layerX;
			let y = e.layerY;
			const h = this.height / this.keyboardRange;
			const noteSize = this.defaultWidth / this.beat;
			//キャンバス上の位置がマス目の中でどこに位置するかを調べる
			x = Math.floor(x / noteSize) * noteSize;
			y = Math.floor(y / h) * h;
			this.drawNote(x, y, noteSize, h, color, false);
			this.noteList[this.rectNum]
				= {
					rawX: x, rawY: y,
				fixedX: x / (noteSize / (16 / this.beat)), fixedY: y / h,
				width: noteSize, height: h,
				color: color, selected: false
			};
			this.rectNum++;
			return;
		},
		//ノートの描画
		drawNote: function (x, y, width, height, color, selected) {
			if (selected)
				this.context.globalAlpha = 0.2;
			this.context.fillStyle = "#000000";
			this.context.fillRect(x, y, width, height);
			this.context.shadowBlur = 0;
			this.context.shadowOffsetX = 0;
			this.context.shadowOffsetY = 0;
			if (selected)
				this.context.globalAlpha = 0.6;
			this.context.fillStyle = color;
			this.context.fillRect(x + 2, y + 2, width - 4, height - 4);
			this.context.globalAlpha = 1.0;
		},
		//描画のやり直し
		drawAll: function () {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.drawDivider(this.beat);
			this.drawAllNote();
		},
		drawAllNote: function () {
			for (let key in this.noteList) {
				this.drawNote(this.noteList[key].rawX, this.noteList[key].rawY,
					this.noteList[key].width, this.noteList[key].height,
					this.noteList[key].color, this.noteList[key].selected);
			}
		},
		drawDivider: function (beat) {
			this.context.strokeStyle = "#708090";
			//横の色
			for (let i = 0; i < this.keyboardRange; i++) {
				if (this.keyboardFlag[i] == 1)
					this.context.fillStyle = "#d3d3d3";
				else
					this.context.fillStyle = "#fffafa";
				this.context.fillRect(0, i * this.height / this.keyboardRange,
					this.width, (i + 1) * this.height / this.keyboardRange);
			}
			//横線
			for (let i = 0; i < this.keyboardRange + 1; i++) {
				this.context.lineWidth = 1.0;
				this.context.beginPath();
				this.context.moveTo(0, i * this.height / this.keyboardRange);
				this.context.lineTo(this.width, i * this.height / this.keyboardRange);
				this.context.stroke();
				this.context.closePath();
			}
			this.context.stroke();
			this.context.closePath();
			//縦線
			const per = this.defaultWidth / beat;
			for (let i = 0; i < this.width / this.defaultWidth; i++) {
				for (let j = 0; j < beat; j++) {
					this.context.lineWidth = (j == 0) ? 2.0 : 1.0;
					this.context.beginPath();
					this.context.moveTo(this.defaultWidth * i + per * j, 0);
					this.context.lineTo(this.defaultWidth * i + per * j, this.height);
					this.context.stroke();
					this.context.closePath();
				}
			}
			this.context.lineWidth = 2.0;
			this.context.beginPath();
			this.context.moveTo(this.width, 0);
			this.context.lineTo(this.width, this.height);
			this.context.stroke();
			this.context.closePath();
			return;
		}
	},
	mounted: function () {
		this.canvas = document.querySelector('#myCanvas');
		this.context = this.canvas.getContext('2d');
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.drawDivider(this.beat);
		document.oncontextmenu = function () { return false; };
	}
});