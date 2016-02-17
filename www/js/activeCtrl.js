angular.module('activeCtrl', ['ionic', 'agentService'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.controller('activeCtrl', ActiveCtrl);

function ActiveCtrl (agentService, $location) {
	this.agentService = agentService;
	this.$location = $location;

	this.selectedOrder= undefined;
	this.allOrdersBeGot = false;
	this.assignmentReadyToFinish = false;
}

ActiveCtrl.prototype.taskComplete = function (taskId) {
	var emptyObj = {};
	this.agentService.taskComplete(taskId);
};

ActiveCtrl.prototype.arriveAssignment = function () {
	var emptyObj = {};
	var self = this;
	this.agentService.assignmentAction(this.agentService.activeAssignment.id, 'arrive/').then(function(results){
		console.log('results arrive assignment', results);
		self.assignmentReadyToFinish = true;
	});
};

ActiveCtrl.prototype.completeAssignment = function () {
	var self = this;
	var emptyObj = {};
	this.agentService.assignmentAction(this.agentService.activeAssignment.id, 'complete/').then(function(results){
		console.log('results arrive assignment, results');
		self.selectedOrder = undefined;
		self.allOrdersBeGot = false;
		self.assignmentReadyToFinish = false;
		self.agentService.activeAssignment = undefined;
		self.$location.path('/');
	})
};

ActiveCtrl.prototype.selectOrder = function (order) {
	this.selectedOrder = order;
	console.log('this.selectedOrder', this.selectedOrder);
};

ActiveCtrl.prototype.deSelectOrder = function() {
	this.selectedOrder = undefined;
};

ActiveCtrl.prototype.orderSelected = function () {
	return this.selectedOrder ? true : false;
};

ActiveCtrl.prototype.orderBeGot = function () {
	this.selectedOrder['isGot'] = true;
	this.selectedOrder = undefined;
	this.checkOrdersBeGot();
};

ActiveCtrl.prototype.checkOrdersBeGot = function () {
	var currentAssignment = this.agentService.activeAssignment;

	for (var i = 0; i < currentAssignment.tasks.length; i++){
		var currentTask = currentAssignment.tasks[i];
		if (!currentTask.isGot){
			for (var x = 0; x < currentTask.orders.length; x++){
				var currentOrder = currentTask.orders[x];
				if(!currentOrder.isGot){
					return;
				}
			}
			currentTask['isGot'] = true;
			this.taskComplete(currentTask.id);
		}
	}
	this.allOrdersBeGot = true;
};