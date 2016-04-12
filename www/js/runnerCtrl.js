angular.module('runnerCtrl', ['ionic', 'agentService'])
	.controller('runnerCtrl', RunnerCtrl);

function RunnerCtrl (agentService, $state) {
	this.agentService = agentService;
	this.$state = $state;

	this.activeRunnerAssignment = this.agentService.getRunnerAssignments()[0];
}


RunnerCtrl.prototype.completeAssignment = function () {
	var self = this;
	this.agentService.completeRunnerAssignment();
	this.agentService.resetApp();
};
