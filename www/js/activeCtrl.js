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

//Controller for a user's current assignment
function ActiveCtrl (agentService, $location) {
	this.agentService = agentService;
	this.$location = $location;

	this.allEntriesBeGot = false;
	this.assignmentReadyToFinish = false;
}

/**
 * Sends this back to the server when all orders for a task have been picked up
 * @param{Number} taskId
 */
ActiveCtrl.prototype.taskComplete = function (taskId) {
	var emptyObj = {};
	this.agentService.taskComplete(taskId);
};

/**
* For sending a text message to the guest that the driver has arrived
*/
ActiveCtrl.prototype.arriveAssignment = function () {
	var emptyObj = {};
	var self = this;
	this.agentService.assignmentAction(this.agentService.activeAssignment.id, 'arrive/').then(function(results){
		self.assignmentReadyToFinish = true;
	});
};

/**
* Closes out the assignment and sends the user back to the assignmentList view
*/
ActiveCtrl.prototype.completeAssignment = function () {
	var self = this;
	var emptyObj = {};
	this.agentService.assignmentAction(this.agentService.activeAssignment.id, 'complete/').then(function(results){
		self.agentService.selectedOrder = undefined;
		self.agentService.allTasksComplete = false;
		self.assignmentReadyToFinish = false;
		self.agentService.activeAssignment = undefined;
		self.agentService.orderGottenIds = [];
		self.$location.path('/list');
	})
};

/**
* selectOrder, deSelectOrder, and orderSelected are for changing the view to see order details
* @param{Object} order
*/
ActiveCtrl.prototype.selectOrder = function (order) {
	this.agentService.selectedOrder = order;
	this.$location.path('/selectedOrder');
};

/**
* selectOrder, deSelectOrder, and orderSelected are for changing the view to see order details
*/
ActiveCtrl.prototype.deSelectOrder = function() {
	this.agentService.selectedOrder = undefined;
};

/**
 * selectOrder, deSelectOrder, and orderSelected are for changing the view to see order details
 * @returns{Boolean}
 */
ActiveCtrl.prototype.orderSelected = function () {
	return this.agentService.selectedOrder ? true : false;
};

/**
 * When a user gets an order it marks it as picked up and checks to see if that's all the orders
 */
ActiveCtrl.prototype.orderBeGot = function () {
	this.agentService.orderGottenIds.push(this.agentService.selectedOrder.id)
	//this.agentService.selectedOrder['isGot'] = true;
	this.checkAllTasksComplete();
	this.agentService.selectedOrder = undefined;
	this.$location.path('/activeAssignment');
};

/**
 * Checks to see in orderGottenIds if all of them have been pushed
 * @param{Object} task
 * @returns{Boolean}
 */
ActiveCtrl.prototype.checkOrderBeGot = function (order) {
	if(!order){return false;}
	if(this.agentService.orderGottenIds.indexOf(order.id) < 0){
		return false;
	} else {
		return true;
	}

};

/**
 * Checks to see if all the orders at a restaurant have been taken, if so calls completeTask()
 */
ActiveCtrl.prototype.checkAllTasksComplete = function () {
	var currentAssignment = this.agentService.activeAssignment;

	for (var i = 0; i < currentAssignment.tasks.length; i++){
		var currentTask = currentAssignment.tasks[i];
		if (!(currentTask.status === 'complete')){
			for (var x=0; x < currentTask.orders.length; x++){
				if(!this.checkOrderBeGot(currentTask.orders[x])) {
					return;
				}
			}
			currentTask.status = "complete";
			this.taskComplete(currentTask.id);
		}
	}
	this.agentService.allTasksComplete = true;
};

/**
* For confirming an entry
* @param{Object} entry
*/
ActiveCtrl.prototype.entryToggleCheck = function (entry) {
	entry.checked = !entry.checked;
	this.allEntriesChecked();
};

/**
* Checks to see if all entries have been checked
*/
ActiveCtrl.prototype.allEntriesChecked = function () {
	for(var i in this.agentService.selectedOrder.entries) {
		var entry = this.agentService.selectedOrder.entries[i];
		if (!entry.checked) {
			this.allEntriesBeGot = false;
			return;
		}
	}
	this.allEntriesBeGot = true;
};

/**
* For highlighting the current task
* @param{Object} task
* @returns{Boolean}
*/
ActiveCtrl.prototype.checkStatus = function (task) {
	return task.status == 'active' ? true : false;
};