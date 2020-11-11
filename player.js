Vue.component('player-component',{
	template: `
	<div>
		<input type="range" min="0" v-bind:max=seekBarRange step="1"
		v-bind:style="{width:seekBarWidth}">
		<br>
		<button style="left:50%"
		v-on:click="sequencePlay()">
		  <span v-if=nowPlaying>&#9209;</span>
		  <span v-else>&#9205;</span>
		</button>
	</div>
	`,
	data: function(){
		return{
			seekBarRange:1,
			seekBarWidth:640,
			nowPlaying:false,
		}
	},
	methods:{
		//親から呼び出し、シークバーの表示を設定する
		setSeekbarProps:function(newWidth,newRange){
			this.seekBarRange=newRange;
			this.seekBarWidth=newWidth;
			return;
		},
		//親からノートデータをもらい、再生位置から再生する
		//すでに再生している場合は停止して破棄
		sequencePlay:function(){
			this.nowPlaying=!this.nowPlaying;
			if(!this.nowPlaying)
				return;
		}
	}
});