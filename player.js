Vue.component('player-component',{
	template: `
	<div>
		<input type="range" min="0" v-bind:max=seekBarRange step="1"
		v-bind:style="{width:seekBarWidth}"
		v-model:value=seekBarPoint>
		<br>
		<button style="left:50%"
		v-on:click="sequencePlay()">
		  <span v-if=nowPlaying>&#9209;</span>
		  <span v-else>&#9205;</span>
		</button>
		<br>
		<span>{{$data}}</span>
	</div>
	`,
	data: function(){
		return{
			seekBarRange:1,
			seekBarWidth:640,
			seekBarPoint:0,
			nowPlaying:false,
			audioContext:{},
			sequenceData:{},
		}
	},
	methods:{
		//親から呼び出し、シークバーの表示を設定する
		setSeekbarProps:function(newWidth,newRange){
			this.seekBarRange=newRange;
			this.seekBarWidth=newWidth;
			return;
		},
		//親で呼び出し、JSONで送られたデータを子に受け渡す
		getSequenceDataJSON:function(data){
			this.sequenceData=JSON.parse(data);
			return;
		},
		//親からノートデータをもらい、再生位置から再生する
		//すでに再生している場合は停止して破棄
		sequencePlay:async function(){
			this.nowPlaying=!this.nowPlaying;
			if(!this.nowPlaying)
				return;
			//ここから再生のための処理
			//シーケンスデータを親から獲得する
			this.$emit('play',{BPM:120, startPosition:this.seekBarPoint});
			await function(){};
			//何もない場合は何もしない
			if(this.sequenceData.length==0){
				this.nowPlaying=false;
				return;	
			}

		}
	},
	mounted:function(){
		this.audioContext=new AudioContext();
	}
});