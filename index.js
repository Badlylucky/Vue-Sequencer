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
		height:840,
		color:'#4169E1',
		rectList:{},
		rectNum: 0,
		isDrag:false,
		draggingIndex: -1,
		relx:0,
		rely:0,
	},
	methods:{
		expandCanvas:function(){
			this.width+=this.defaultWidth;
			this.canvas.width=this.width;
			this.drawDivider(this.beat);
			this.drawAllRect();
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
				this.addRect(e,color);
			}else{
				this.isDrag=true;
				this.draggingIndex=index;
				this.relx=this.rectList[index].rawX-x;
				this.rely=this.rectList[index].rawY-y;
			}
			return;
		},
		//選択した図形をドラッグしているときの処理
		onDrag:function(e){
			if(!this.isDrag){
				return;
			}
			//キャンバスの左上の座標を取得
			const offsetX = this.canvas.getBoundingClientRect().left;
			const offsetY = this.canvas.getBoundingClientRect().top;
			//マウスが押されたcanvas上の座標を取得
			const x=e.clientX - offsetX + this.relx + this.rectList[this.draggingIndex].width/40;
			const y=e.clientY - offsetY;
			const h=this.height/this.keyboardRange;
			//console.log(x+", "+y);
			const noteSize=this.defaultWidth/this.beat;
			//キャンバス上の位置がマス目の中でどこに位置するかを調べる
			const RawX=Math.floor(x/noteSize)*noteSize;
			const RawY=Math.floor(y/h)*h;
			//マス目上に修正された座標を調べる
			const fixedX=RawX/(noteSize/(16/this.beat));
			const fixedY=RawY/h;
			//ドラッグされていて、fixedの位置が変わっていれば描画オブジェクトの位置を更新して描画
			if(this.isDrag &&
				!(fixedX==this.rectList[this.draggingIndex].fixedX &&
					fixedY==this.rectList[this.draggingIndex].fixedY )
			  ){
				this.rectList[this.draggingIndex].rawX=RawX;
				this.rectList[this.draggingIndex].rawY=RawY;
				this.rectList[this.draggingIndex].fixedX=fixedX;
				this.rectList[this.draggingIndex].fixedY=fixedY;
				this.drawAll();
			}
		},
		//ドラッグの終了
		onMouseLeftUp:function(){
			this.isDrag=false;
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
		addRect:function(e,color){
			let x=e.layerX;
			let y=e.layerY;
			const h=this.height/this.keyboardRange;
			const noteSize=this.defaultWidth/this.beat;
			//キャンバス上の位置がマス目の中でどこに位置するかを調べる
			x=Math.floor(x/noteSize)*noteSize;
			y=Math.floor(y/h)*h;
			this.context.fillStyle=color;
			this.context.fillRect(x,y,noteSize,h);
			this.rectList[this.rectNum]
			={rawX:x,rawY:y,fixedX:x/(noteSize/(16/this.beat)),fixedY:y/30,width:noteSize,height:h,color:color};
			this.rectNum++;
			return;
		},
		//ノートの描画
		// drawNote:function(x,y,width,height,color){

		// },
		//描画のやり直し
		drawAll:function(){
			this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
			this.drawDivider(this.beat);
			this.drawAllRect();
		},
		drawAllRect:function(){
			for(let key in this.rectList){
				this.context.fillStyle=this.rectList[key].color;
				this.context.fillRect(this.rectList[key].rawX,this.rectList[key].rawY,
					this.rectList[key].width,this.rectList[key].height);
			}
		},
		drawDivider:function(beat){
			this.context.strokeStyle="rgb(38,38,38)";
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