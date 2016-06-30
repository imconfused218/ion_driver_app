angular.module('activeCtrl', ['ionic', 'agentService'])
.controller('activeCtrl', ActiveCtrl);

//Controller for a user's current assignment
function ActiveCtrl (agentService, $state, $ionicHistory, $ionicPopup, $q) {
	this.agentService = agentService;
	this.$state = $state;
	this.$ionicPopup = $ionicPopup;
	this.$q = $q;
	//this.$ionicHistory = $ionicHistory;

	this.allEntriesBeGot = false;
	this.allEntriesChecked();
	this.assignmentReadyToFinish = false;

	/*if (!this.agentService.selectedOrder){
		console.log('called');
		this.$ionicHistory.nextViewOptions({
			disableBack: true
		});
	} else {
		this.$ionicHistory.nextViewOptions({
			disableBack: false
		});
	}*/
}

/**
 * Sends this back to the server when all orders for a task have been picked up
 * @param{Number} taskId
 */
ActiveCtrl.prototype.taskComplete = function (taskId) {
	var self = this;
	var emptyObj = {};

	return this.agentService.taskComplete(taskId).then(function(result) {
		return result;
	}, function(err) {
		self.agentService.getAssignments().then(function(result) {
			return result;
		}, function(err) {
			self.makePopup("Connection Error", "Please check your internet connection", "alert");
		});
	});
};

/**
* For sending a text message to the guest that the driver has arrived
*/
ActiveCtrl.prototype.arriveAssignment = function () {
	var emptyObj = {};
	var self = this;
	this.agentService.assignmentAction(this.agentService.activeAssignment.id, 'arrive/').then(function(results){
		self.assignmentReadyToFinish = true;
	}, function(err) {
		self.makePopup("Error", "Please try again", "alert")
	});
};

/**
* Closes out the assignment and sends the user back to the assignmentsList view
*/
ActiveCtrl.prototype.completeAssignment = function () {
	var self = this;
	var emptyObj = {};
	this.agentService.assignmentAction(this.agentService.activeAssignment.id, 'complete/').then(function(results){
  	self.agentService.getAssignments().then(function(result) {
  		self.agentService.selectedOrder = undefined;
  		self.agentService.routeMe();
  	}, function(err) {
  		self.$state.go('assignmentsList');
  	})
	}, function(err) {
		self.makePopup("Error", "Unable to complete assignment", "alert")
	})
};

/**
* selectOrder, deSelectOrder, and orderSelected are for changing the view to see order details
* @param{Object} order
*/
ActiveCtrl.prototype.selectOrder = function (order) {
	this.agentService.selectedOrder = order;
	this.$state.go('selectedOrder');
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
	if (!this.agentService.internetProblem) {
		this.agentService.orderGottenIds.push(this.agentService.selectedOrder.id)
		this.checkAllTasksComplete();
		this.agentService.selectedOrder = undefined;
		this.$state.go('activeAssignment');
	} else {
		self.makePopup("Connection Error", "Please check your internet connection", "alert")
	}
};

/**
 * Checks to see in orderGottenIds if all of them have been pushed
 * @param{Object} task
 * @returns{Boolean}
 */
ActiveCtrl.prototype.checkOrderBeGot = function (order) {
	if (!order) return false;
	if (this.agentService.orderGottenIds.indexOf(order.id) < 0) {
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

	for (var i = 0; i < currentAssignment.tasks.length; i++) {
		var currentTask = currentAssignment.tasks[i];
		if (!(currentTask.status === 'complete')) {
			for (var x=0; x < currentTask.orders.length; x++) {
				if (!this.checkOrderBeGot(currentTask.orders[x])) {
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
	if(!(angular.isDefined(this.agentService.selectedOrder))){
		return;
	}
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

ActiveCtrl.prototype.makePopup = function (title, desc, type) {
  var alertPopup = this.$ionicPopup[type]({
    title: title || "Error",
    template: desc || "",
  });
  return alertPopup;
};









