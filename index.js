var app=new Vue({
	el: '#app',
	data:{
		canvas: {},
		context: {},
		keyboardRange:36,
		keyboardFlag:[0,1,0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0],
		defaultWidth:640,
		beat:4,
		width:640,
		height:900,
		color:'#4169E1',
		rectList:{},
		rectNum: 0,
		dragStatus:-1,
		draggingIndex: -1,
		relx:0,
		rely:0,
	},
	methods:{
		expandCanvas:function(){
			this.width+=this.defaultWidth;
			this.canvas.width=this.width;
			this.drawDivider(this.beat);
			this.drawAllNote();
			return;
		},
		searchClickRect:function(mousex,mousey){
			let ret=-1;
			for(let key in this.rectList){
				if(this.rectList[key].rawX<mousex && mousex<this.rectList[key].rawX+this.rectList[key].width &&
					this.rectList[key].rawY<mousey && mousey<this.rectList[key].rawY+this.rectList[key].height){
						ret=key;
						break;
					}
			}
			return ret;
		},
		//左のマウスボタンを押したときの処理
		//すでに配置した図形の範囲内でなければ図形を配置
		//範囲内ならドラッグ
		onMouseLeftDown:function(e,color){
			//キャンバスの左上の座標を取得
			const offsetX = this.canvas.getBoundingClientRect().left;
			const offsetY = this.canvas.getBoundingClientRect().top;
			//マウスが押されたcanvas上の座標を取得
			const x=e.clientX - offsetX;
			const y=e.clientY - offsetY;
			const index = this.searchClickRect(x,y);
			if(index==-1){
				this.addNote(e,color);
			}else{
				//ノートの移動か引き伸ばしかを判定する
				this.draggingIndex=index;
				this.relx=this.rectList[index].rawX-x;
				this.rely=this.rectList[index].rawY-y;
				const left=this.rectList[index].rawX+Math.max(10,this.rectList[index].width/8);
				const right=(this.rectList[index].rawX+this.rectList[index].width)
								-Math.max(10,this.rectList[index].width/8);
				//真ん中ならノートの移動
				if(left<=x && x<=right){
					this.dragStatus=1;
				}else if(x<left){
					//左側なら左へ引き伸ばし
					this.dragStatus=2;
				}else if(x>right){
					//右側なら右へ引き伸ばし
					this.dragStatus=3;
				}
				console.log(this.dragStatus);
			}
			return;
		},
		//選択した図形をドラッグしているときの処理
		onDrag:function(e){
			if(this.dragStatus==-1){
				return;
			}
			//キャンバスの左上の座標を取得
			const offsetX = this.canvas.getBoundingClientRect().left;
			const offsetY = this.canvas.getBoundingClientRect().top;
			//マウスが押されたcanvas上の座標を取得
			let x=e.clientX - offsetX;
			const y=e.clientY - offsetY;
			switch(this.dragStatus){
				case 1:
					this.moveNote(x,y); break;
				case 2:
					this.extendNoteLeft(x,y); break;
				case 3:
					this.extendNoteRight(x,y); break;
			}
		},
		moveNote:function(x,y){
			x+=this.rectList[this.draggingIndex].width/40+this.relx;
			const h=this.height/this.keyboardRange;
			//console.log(x+", "+y);
			const noteSize=this.defaultWidth/this.beat;
			//キャンバス上の位置がマス目の中でどこに位置するかを調べる
			const RawX=Math.floor(x/noteSize)*noteSize;
			const RawY=Math.floor(y/h)*h;
			//マス目上に修正された座標を調べる
			const fixedX=RawX/(noteSize/(16/this.beat));
			const fixedY=RawY/h;
			//fixedの位置が変わっていれば描画オブジェクトの位置を更新して描画
			if(!(fixedX==this.rectList[this.draggingIndex].fixedX &&
					fixedY==this.rectList[this.draggingIndex].fixedY )
			  ){
				this.rectList[this.draggingIndex].rawX=RawX;
				this.rectList[this.draggingIndex].rawY=RawY;
				this.rectList[this.draggingIndex].fixedX=fixedX;
				this.rectList[this.draggingIndex].fixedY=fixedY;
				this.drawAll();
			}
		},
		extendNoteLeft:function(x,y){
			//現在のマス目のサイズを調べる
			const noteSize=this.defaultWidth/this.beat;
			const h=this.height/this.keyboardRange;
			//右端は変わらないので右端を保持
			const right=
			this.rectList[this.draggingIndex].rawX+this.rectList[this.draggingIndex].width;
			//キャンバス上の位置がマス目の中でどの座標に位置するかを調べる
			const RawX=Math.floor(x/noteSize)*noteSize;
			//rawの情報からどのマス目かを調べる
			const fixedX=RawX/(noteSize/(16/this.beat));
			//右端より右に行っていない　かつ　
			//fixedXの位置が変わっていれば、描画オブジェクトの位置を更新して描画
			if(RawX<right && fixedX!=this.rectList[this.draggingIndex].fixedX){
				if(RawX<this.rectList[this.draggingIndex].rawX)
					this.rectList[this.draggingIndex].width+=noteSize;
				else
					this.rectList[this.draggingIndex].width-=noteSize;
				this.rectList[this.draggingIndex].rawX=RawX;
				this.rectList[this.draggingIndex].fixedX=fixedX;
				this.drawAll();
			}
		},
		extendNoteRight:function(x,y){
			//現在のマス目のサイズを調べる
			const noteSize=this.defaultWidth/this.beat;
			const h=this.height/this.keyboardRange;
			//左端は変わらない
			const left=this.rectList[this.draggingIndex].rawX;
			//右端も持つ
			const right=left+this.rectList[this.draggingIndex].width;
			const fixedRight=right/(noteSize/(16/this.beat));
			//キャンバス上の位置がマス目の中でどの座標に位置するかを調べる
			const RawX=Math.floor(x/noteSize)*noteSize;
			//rawの情報からどのマス目かを調べる
			const fixedX=RawX/(noteSize/(16/this.beat));
			console.log(fixedRight+" "+fixedX);
			//左端より左に行っていない　かつ　
			//fixedXの位置が変わっていれば、描画オブジェクトの位置を更新して描画
			if(RawX>left && fixedX!=fixedRight){
				if(RawX>right)
					this.rectList[this.draggingIndex].width+=noteSize;
				else
					this.rectList[this.draggingIndex].width-=noteSize;
				this.drawAll();
			}
		},
		//ドラッグの終了
		onMouseLeftUp:function(){
			this.dragStatus=-1;
			this.draggingIndex=-1;
		},
		//右クリックしたときの処理
		//クリックした場所が長方形の範囲内なら消す
		//重なっている場合はひとつだけ消す
		onMouseRightDown:function(e){
			//キャンバスの左上の座標を取得
			const offsetX = this.canvas.getBoundingClientRect().left;
			const offsetY = this.canvas.getBoundingClientRect().top;
			//マウスが押されたcanvas上の座標を取得
			const x=e.clientX - offsetX;
			const y=e.clientY - offsetY;
			const index = this.searchClickRect(x,y);
			if(index!=-1){
				delete(this.rectList[index]);
			}
			this.drawAll();
			return;
		},
		//クリックした座標に長方形を追加
		addNote:function(e,color){
			let x=e.layerX;
			let y=e.layerY;
			const h=this.height/this.keyboardRange;
			const noteSize=this.defaultWidth/this.beat;
			//キャンバス上の位置がマス目の中でどこに位置するかを調べる
			x=Math.floor(x/noteSize)*noteSize;
			y=Math.floor(y/h)*h;
			this.drawNote(x,y,noteSize,h,color);
			this.rectList[this.rectNum]
			={rawX:x,rawY:y,fixedX:x/(noteSize/(16/this.beat)),fixedY:y/h,width:noteSize,height:h,color:color};
			this.rectNum++;
			return;
		},
		//ノートの描画
		drawNote:function(x,y,width,height,color){
			//ここを変える
			this.context.fillStyle="#000000";
			this.context.fillRect(x,y,width,height);
			this.context.fillStyle=color;
			this.context.fillRect(x+2,y+2,width-4,height-4);
		},
		//描画のやり直し
		drawAll:function(){
			this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
			this.drawDivider(this.beat);
			this.drawAllNote();
		},
		drawAllNote:function(){
			for(let key in this.rectList){
				this.drawNote(this.rectList[key].rawX,this.rectList[key].rawY,
					this.rectList[key].width,this.rectList[key].height,
					this.rectList[key].color);
			}
		},
		drawDivider:function(beat){
			this.context.strokeStyle="#708090";
			//横の色
			for(let i=0;i<this.keyboardRange;i++){
				if(this.keyboardFlag[i]==1)
					this.context.fillStyle="#d3d3d3";
				else
					this.context.fillStyle="#fffafa";
				this.context.fillRect(0,i*this.height/this.keyboardRange,
					this.width,(i+1)*this.height/this.keyboardRange);
			}
			//横線
			for(let i=0;i<this.keyboardRange+1;i++){
				this.context.lineWidth=1.0;
				this.context.beginPath();
				this.context.moveTo(0,i*this.height/this.keyboardRange);
				this.context.lineTo(this.width,i*this.height/this.keyboardRange);
				this.context.stroke();
				this.context.closePath();
			}
			this.context.stroke();
			this.context.closePath();
			//縦線
			const per=this.defaultWidth/beat;
			for(let i=0;i<this.width/this.defaultWidth;i++){
				for(let j=0;j<beat;j++){
					this.context.lineWidth = (j==0)?2.0:1.0;
					this.context.beginPath();
					this.context.moveTo(this.defaultWidth*i+per*j,0);
					this.context.lineTo(this.defaultWidth*i+per*j,this.height);
					this.context.stroke();
					this.context.closePath();
				}
			}
			this.context.lineWidth=2.0;
			this.context.beginPath();
			this.context.moveTo(this.width,0);
			this.context.lineTo(this.width,this.height);
			this.context.stroke();
			this.context.closePath();
			return;
		},
		send:function(){
			sendResult();
		}
	},
	mounted:function(){
		this.canvas = document.querySelector('#myCanvas');
		this.context = this.canvas.getContext('2d');
		this.canvas.width=this.width;
		this.canvas.height=this.height;
		this.drawDivider(this.beat);
		document.oncontextmenu = function(){return false;};
		console.log(this.keyboardFlag[0]);
	}
});

function sendResult(){
	API.LMSSetValue('cmi.core.score.raw', app.score+"")
	API.LMSSetValue('cmi.core.lesson_status',app.lesson_status)
	API.LMSCommit("")
	API.LMSFinish("")
	console.log("送信しました。")
}