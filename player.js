Vue.component('player-component', {
	template: `
	<div>
		<input type="range" min="0" v-bind:max=seekBarRange step="1"
		v-bind:style="{width:seekBarWidth}"
		v-model:value=seekBarPoint>
		<br>
		<div class="center">
			<button style="left:50%"
			  v-on:click="sequencePlay()">
		  		<span v-if=nowPlaying>&#9209;</span>
		  		<span v-else>&#9205;</span>
			</button>
			<span>BPM</span>
			<input type="tel" v-model:value=BPM>
			<input type="range" min="40" max="180" step="1" v-model:value=BPM> 
		</div>
		<br>
		<timer-component ref="timer" v-on:tick=noteScheduler()></timer-component>
	</div>
	`,
	data: function () {
		return {
			seekBarRange: 1,
			seekBarWidth: 640,
			seekBarPoint: 0,
			nowPlaying: false,
			audioContext: {},
			sequenceData: [],
			sequenceIndex: 0,
			BPM: 120,
		}
	},
	methods: {
		//親から呼び出し、シークバーの表示を設定する
		setSeekbarProps: function (newWidth, newRange) {
			this.seekBarRange = newRange;
			this.seekBarWidth = newWidth;
			return;
		},
		//親で呼び出し、JSONで送られたデータを子に受け渡す
		getSequenceDataJSON: function (data) {
			this.sequenceData = JSON.parse(data);
			return;
		},
		//親からノートデータをもらい、再生位置から再生する
		//すでに再生している場合は停止して破棄
		sequencePlay: async function () {
			this.nowPlaying = !this.nowPlaying;
			if (!this.nowPlaying) {
				this.audioContext.close();
				this.sequenceData = [];
				this.sequenceIndex = 0;
				this.$refs.timer.stop();
				return;
			}
			//ここから再生のための処理
			//シーケンスデータを親から獲得する
			this.audioContext = new AudioContext();
			this.$emit('play', { BPM: this.BPM, startPosition: this.seekBarPoint });
			await function () { };
			//何もない場合は何もしない
			if (this.sequenceData.length == 1) {
				this.nowPlaying = false;
				return;
			}
			//currentTimeを動かすためにダミーノードを起動する
			const dummy = new OscillatorNode(this.audioContext, {
				frequency: 0
			});
			dummy.connect(this.audioContext.destination);
			dummy.start();
			dummy.stop();
			this.$refs.timer.start();
		},
		//次に鳴らす音の設定をする
		noteScheduler: function () {
			// this.debuglog();
			while (this.sequenceIndex < this.sequenceData.length &&
				this.sequenceData[this.sequenceIndex].begin <
				this.audioContext.currentTime + 0.1) {
				if (this.sequenceData[this.sequenceIndex].key == -1) {
					//終了処理
					this.nowPlaying = !this.nowPlaying;
					this.audioContext.close();
					this.sequenceData = [];
					this.sequenceIndex = 0;
					this.$refs.timer.stop();
					return;
				}
				//音を鳴らす
				//今はsquare固定
				const osc = new OscillatorNode(this.audioContext, {
					frequency: this.calcFrequency(this.sequenceData[this.sequenceIndex].key),
					type: "square"
				});
				const gain = new GainNode(this.audioContext, {
					gain: 0.5
				});
				osc.connect(gain);
				gain.connect(this.audioContext.destination);
				//クリックノイズを防ぐためにアタックとリリースをかける
				gain.gain.setValueAtTime(0, this.sequenceData[this.sequenceIndex].begin);
				gain.gain.linearRampToValueAtTime(0.5, this.sequenceData[this.sequenceIndex].begin + 0.005);
				gain.gain.setValueAtTime(0, this.sequenceData[this.sequenceIndex].end);
				gain.gain.linearRampToValueAtTime(0, this.sequenceData[this.sequenceIndex].end - 0.005);
				osc.start(this.sequenceData[this.sequenceIndex].begin);
				osc.stop(this.sequenceData[this.sequenceIndex].end);
				this.sequenceIndex++;
			}
		},
		//引数のmidiノート番号の周波数を計算する
		calcFrequency: function (note) {
			let basefreq;
			const n = (note + 12) % 12;
			let basenote;
			switch (n) {
				case 0:
					basefreq = 261.6;
					basenote = 60;
					break
				case 1:
					basefreq = 277.2;
					basenote = 61;
					break
				case 2:
					basefreq = 293.7;
					basenote = 62;
					break
				case 3:
					basefreq = 311.1;
					basenote = 63;
					break;
				case 4:
					basefreq = 329.6;
					basenote = 64;
					break
				case 5:
					basefreq = 349.2;
					basenote = 65;
					break;
				case 6:
					basefreq = 370.0;
					basenote = 66;
					break;
				case 7:
					basefreq = 392.0;
					basenote = 67;
					break;
				case 8:
					basefreq = 415.3;
					basenote = 68;
					break;
				case 9:
					basefreq = 440.0;
					basenote = 69;
					break;
				case 10:
					basefreq = 466.2;
					basenote = 70;
					break;
				case 11:
					basefreq = 493.9;
					basenote = 71;
					break;
			}
			return basefreq * Math.pow(2.0, (note - basenote) / 12);
		},
		debuglog: function () {
			console.log(this.audioContext.currentTime);
		}
	},
});
var newWorkerViaBlob = function (relativePath) {
	var baseURL = window.location.href.replace(/\\/g, '/').replace(/\/[^\/]*$/, '/');
	var array = ['importScripts("' + baseURL + relativePath + '");'];
	var blob = new Blob(array, { type: 'text/javascript' });
	var url = window.URL.createObjectURL(blob);
	return new Worker(url);
};