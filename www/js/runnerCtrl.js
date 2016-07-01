angular.module('runnerCtrl', ['ionic', 'agentService'])
	.controller('runnerCtrl', RunnerCtrl);

function RunnerCtrl (agentService, $state, $ionicPopup) {
	this.agentService = agentService;
	this.$state = $state;
  this.$ionicPopup = $ionicPopup;
  
}

RunnerCtrl.prototype.selectOrder = function (order) {
  this.agentService.selectedOrder = order;
  this.$state.go('selectedRunnerOrder');
};

RunnerCtrl.prototype.completeAssignment = function (assignment) {
	var self = this;

	this.agentService.completeRunnerAssignment(assignment.id).then(function(result) {
    self.agentService.selectedOrder = undefined;
    self.agentService.activeAssignment = undefined;
    self.agentService.orderGottenIds = [];
    self.agentService.allTasksComplete = false;
    self.$state.go('assignmentsList');
  }, function(err){
    self.makePopup('Error', "Could not complete assignment. Try again", "alert");
  });
	
};

RunnerCtrl.prototype.makePopup = function (title, desc, type) {
  var alertPopup = this.$ionicPopup[type]({
    title: title || "Error",
    template: desc || "",
  });

  return alertPopup;
};
