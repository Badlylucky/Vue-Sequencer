Vue.component('timer-component', {
	template: `<span></span>`,
	data: function () {
		return {
			ID: null,
			interval: 25,
		}
	},
	methods: {
		start: function () {
			this.ID = setInterval(this.sendTick, this.interval);
			return;
		},
		stop: function () {
			clearInterval(this.ID);
			return;
		},
		sendTick: function () {
			this.$emit('tick');
			return;
		}
	},
});