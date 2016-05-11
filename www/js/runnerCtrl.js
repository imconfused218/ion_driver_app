angular.module('runnerCtrl', ['ionic', 'agentService'])
	.controller('runnerCtrl', RunnerCtrl);

function RunnerCtrl (agentService, $state) {
	this.agentService = agentService;
	this.$state = $state;

  if (!this.agentService.activeAssignment) {
    $state.go('assignmentsList')
  } 
  
}

RunnerCtrl.prototype.selectOrder = function (order) {
  this.agentService.selectedOrder = order;
  this.$state.go('selectedRunnerOrder');
};

RunnerCtrl.prototype.completeAssignment = function (assignment) {
	var self = this;

	this.agentService.completeRunnerAssignment(assignment.id).then(function(result) {
    self.agentService.resetApp();
  }, function(err){
    self.agentService.resetApp();
  });
	
};
