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

function ActiveCtrl (agentService) {
	this.agentService = agentService;
}

ActiveCtrl.prototype.taskComplete = function () {
	var emptyObj = {};
	//agentService.taskComplete(task.id)
};

ActiveCtrl.prototype.arriveAssignment = function () {
	var emptyObj = {};
	this.agentService.assignmentAction(this.agentService.activeAssignment.id, 'arrive/').then(function(results){
		console.log('results arrive assignment', results);
	});
};

ActiveCtrl.prototype.completeAssignment = function () {
	var emptyObj = {};
	this.agentService.assignmentAction(this.agentService.activeAssignment.id, 'complete/').then(function(results){
		console.log('results arrive assignment, results');
	})
};