


angular.module('agentService',['ionic'])
	.service('agentService', AgentService);

//Service for logging in, getting assignments, updating, etc.
function AgentService ($http, $q, $state, $interval, $window, $ionicLoading) {
  this.$q = $q;
  this.$http = $http;
  this.$state = $state;
  this.$interval = $interval;
  this.$window = $window;
  this.$ionicLoading = $ionicLoading;
  this.hostUrl = 'https://menu.me/';
  this.rootUrl = this.hostUrl + 'foodcannon/non-fleet/agent/';
  
  //Assignments List $state variables
  this.runnerAssignments = [];
  this.onduty = false;
  this.clusters = [];
  this.assignments = [];
  this.selectedAssignment;
  this.selectedOrder;

  //active $state variables
  this.activeAssignment;
  this.orderGottenIds = [];
  this.allTasksComplete = false;

  //Agent Service variables
  this.intervalCheck;
  this.geoInterval;
  this.timeStamp = '';
  this.internetProblem = false;
  this.auth = "Token BC04DM5Q-Qjlzk9SrtoZRCcRvbYYsomuVUuqzO8yHi3vl9jS7sKhBd3bRTl7ELhKwmrfpXeqXQQZC";
  this.currentLocation;
  this.configObj = {
    headers: {
      "Authorization": this.auth,
      "Content-Type": 'text/plain'
    }
  };

  //Config object for the loading screen
  this.ionicLoadingConfig = {
    content: 'Loading',
    animation: 'fade-in',
    showBackdrop: true,
    maxWidith: 200,
    showDelay: 0
  };

}


AgentService.prototype.routeMe = function () {
  var completeList = this.assignments.concat(this.runnerAssignments);

  for (var i = 0; i < completeList.length; i++) {
    if (completeList[i].active && completeList[i].type == 'driver') {
      if (this.$state.current.name == 'selectedOrder') {
        return;
      } else {
        this.activeAssignment = completeList[i];
        this.$state.go('activeAssignment');
        return;
      }
    } else if (completeList[i].active && completeList[i].type == 'runner'){
      if (this.$state.current.name == 'selectedRunnerOrder') {
        return;
      } else {
        this.activeAssignment = completeList[i];
        this.$state.go('activeRunnerAssignment');
        return;
      }
    }
  }

  if (this.$state.current.name == 'selectedAssignment' || this.$state.current.name == 'selectedRunnerAssignment') {
    return;
  } else {
    this.$state.go('assignmentsList');
  }
};

/**
 * If an error or something goes wrong reset the app
 */
/*AgentService.prototype.resetApp = function () {
  var self = this;

  this.stopIntervalCheck();
  this.clusters = [];
  this.assignments = [];
  this.runnerAssignments = [];
  this.selectedAssignment = undefined;
  this.selectedOrder = undefined;
  this.activeAssignment = undefined;
  this.orderGottenIds = [];
  this.allTasksComplete = false;
  this.currentLocation = undefined;
  this.timeStamp = '';
  return this.getInitialInformation().then(function(result) {
    self.$state.go('assignmentsList')
    return result;
  }, function(err) {
    return self.$q.reject(err);
  });
};
*/
/**
 * Passes user email and password to server
 * @param{object} logInInfo - An object wih user log-in information
 * @returns{Promise<Object>}
 */
AgentService.prototype.logIn = function (logInInfo) {
  var self= this;
  var logInUrl = 'api/1/auth/';

  this.$ionicLoading.show(this.ionicLoadingConfig);

  return this.$http.post(this.hostUrl + logInUrl, logInInfo, this.configObj).then(function(results){
    self.configObj.headers['Bearer'] = results.data.auth_token;
    self.$window.localStorage['configObj'] = JSON.stringify(self.configObj);
    self.$ionicLoading.hide();
    this.internetProblem = false;
    return results;
  },function(err){
    console.log('err at logInService', err);
    self.$ionicLoading.hide();
    return self.$q.reject(err);
  });

};

/**
 * On assignments page load, calls getStatus, getAssignments, and getRunnerAssignments
 */
AgentService.prototype.getInitialInformation = function () {
  var self = this;
  var promisesArray = [];

  promisesArray.push(this.getAssignments());
  promisesArray.push(this.getRunnerAssignments());
  promisesArray.push(this.getStatus());

  return this.$q.all(promisesArray).then(function(result){
    this.internetProblem = false;
    return result;
  }, function(err){
    return self.$q.reject(err);
  });
};

/**
 * Gets all assignments for current onDuty location
 * @returns {Promise<Object>}
 */
AgentService.prototype.getAssignments = function () {
  var self = this;

  return this.$http.get(this.rootUrl + 'tasks/', this.configObj).then(function(results) {
    self.assignments = results.data.assignments;
    this.internetProblem = false;
    return results;
  }, function(err) {
    console.log('err at assignmentsService', err);
    return self.$q.reject(err);
  });
};


/**
 * Checks to see if agent is on-duty
 * @returns {Promise<Object>}
 */
AgentService.prototype.getStatus = function () {
  var self = this;

  return this.$http.get(this.rootUrl + 'status/', this.configObj).then(function(results) {
    self.clusters = results.data.groups;
    if (self.checkForOnDuty()) {
      self.startIntervalCheck();
      self.startGeoInterval();
    } else {
      self.stopIntervalCheck();
      self.stopGeoInterval();
    }
    return results;
  }, function(err) {
    console.log('err at getStatus', err);
    return self.$q.reject(err);
  });
};

/**
 * Resolves whether or not an agent is on duty
 */
AgentService.prototype.resolveStatuses = function () {
  var statusArray= [];
  var self = this;

  for (var i in this.clusters) {
    statusArray.push(this.postStatus(this.clusters[i]));
  }

  return this.$q.all(statusArray).then(function(results){
    if (self.checkForOnDuty()) {
      self.getRunnerAssignments();
      self.getAssignments();
      self.startIntervalCheck();
      self.startGeoInterval();
      return results;
    } else {
      self.stopIntervalCheck();
      self.stopGeoInterval();
      self.assignments = [];
      self.runnerAssignments = [];
      return results;
    }
  }, function(err) {
    return self.$q.reject(err);
  })
};

/**
 * Tells the server to go on-duty or off-duty
 * @param {object} cluster - A cluster of hotels
 * @returns {Promise<object>}
 */
AgentService.prototype.postStatus = function (cluster) {
  var self = this;
  var groupId = cluster.id;
  var on_duty = cluster.on_duty
  var emptyData = {};

  return this.$http.post(this.rootUrl + groupId + '/' + on_duty + '/', emptyData, this.configObj).then(function(results){
    return results;
  }, function(err){
    console.log('err at postStatus', err);
    return self.$q.reject(err);
  });

};

/**
* Checks to see if user currently has an active assignment
* @params{Array} - assignments
*/
/*
AgentService.prototype.checkForActive = function (assignments) {
	if (assignments[0]) {
    for (var i = 0; i < assignments.length; i++) {
      if (assignments[i].active && assignments[i].type == 'driver') {
        this.activeAssignment = assignments[i];
        this.$state.go('activeAssignment');
      } else if (assignments[i].active && assignments[i].type == 'runner') {
        this.activeAssignment = this.assignments[i];
        this.$state.go('activeRunnerAssignment');
      }
    }
	}
};
*/
/**
 * Checks to see if the agent is currently on duty
 * @returns {Boolean}
 */
AgentService.prototype.checkForOnDuty = function () {
	for (var i in this.clusters) {
		if (this.clusters[i] && this.clusters[i].on_duty) {
			return true;
		}
	}
	return false;
};

/**
* Gets the user's current location
*/
AgentService.prototype.getLocation = function () {
  var self = this;
  var geoOptions = {
    timeout: 5000,
    enableHighAccuracy: false
  }
 
  navigator.geolocation.getCurrentPosition(function(position) {
    self.currentLocation = position;
  }, function(error) {
    console.log('error getting geolocation', error);
  }, geoOptions);
};

/**
 * Asks server if the UI needs to be updated
 * @returns{Promise<Object>}
 */
AgentService.prototype.checkForChanges = function () {
	var self = this;
	var updateObj = {
		lat: "",
		lng: "",
		update: this.timeStamp
	};

  updateObj.device_token = this.$window.localStorage.getItem("ionic_io_push_token") ? JSON.parse(this.$window.localStorage.getItem("ionic_io_push_token")).token : "";
  if (this.currentLocation) {
    updateObj['lat'] = this.currentLocation.coords.latitude;
    updateObj['lng'] = this.currentLocation.coords.longitude;
    updateObj['accuracy'] = this.currentLocation.coords.accuracy;
    updateObj['speed'] = this.currentLocation.coords.speed;
    updateObj['heading'] = this.currentLocation.coords.heading;
  }

	return this.$http.post(this.rootUrl + 'checkin/', updateObj, this.configObj).then(function(result){
		self.timeStamp = result.data.update;
    self.internetProblem = false;
	}, function(err) {
    console.log('err at checkForChanges', err);
    self.internetProblem = true;
    return self.$q.reject(err);
  });
};


/*
 * Calls GeoLocation every 5 seconds when user is on-duty
 */
AgentService.prototype.startGeoInterval = function () {
  var self = this;

  if(angular.isDefined(this.geoInterval)){
    return;
  }

  this.geoInterval = this.$interval(function() {
    self.getLocation();
  }, 5000)
};

/** 
* Stops calling checkForChanges when user goes off-duty
*/
AgentService.prototype.stopGeoInterval = function () {

  if (angular.isDefined(this.geoInterval)) {
    this.$interval.cancel(this.geoInterval);
    this.geoInterval = undefined;
  }
};

/**
 * Calls checkForChanges() every 15 seconds when user is on-duty
 */
AgentService.prototype.startIntervalCheck = function () {
	var self = this;
  var promiseArray = [];

  this.onDuty = true;

	if (angular.isDefined(this.intervalCheck)){
		return;
	}

	this.intervalCheck = this.$interval(function() {

    promiseArray = [];
    promiseArray.push(self.getAssignments());
    promiseArray.push(self.getRunnerAssignments());
    promiseArray.push(self.checkForChanges());
    
    self.$q.all(promiseArray).then(function(result) {
      self.routeMe();
    })

	}, 15000);
};

/** 
* Stops calling checkForChanges when user goes off-duty
*/
AgentService.prototype.stopIntervalCheck = function () {

  this.onDuty = false;

	if (angular.isDefined(this.intervalCheck)) {
		this.$interval.cancel(this.intervalCheck);
		this.intervalCheck = undefined;
    this.internetProblem = false;
	}
};

/**
 * General function for making a change to an assignment, ex. "Got it", "arriving", "complete"
 * @param{Number} assignmentId
 * @param{String} action
 * @returns{Promise{Object}}
 */
AgentService.prototype.assignmentAction = function (assignmentId, action) {
  var self = this;
	var emptyObj = {};

  this.$ionicLoading.show(this.ionicLoadingConfig);
	return this.$http.post(this.rootUrl + 'assignments/' + action + assignmentId + '/', emptyObj, this.configObj).then(function(results){
		self.$ionicLoading.hide();
    this.internetProblem = false;
		return results;
	}, function(err){
    console.log('err at assignmentAction', err);
    self.$ionicLoading.hide();
    return self.$q.reject(err);
  });
};

/**
* Posts to server when all orders for a task have been "got"
* @param{Number} taskId
* @returns{Promise<Object>}
*/
AgentService.prototype.taskComplete = function (taskId) {
  var emptyObj = {};
  var self = this;

  return this.$http.post(this.rootUrl + 'tasks/complete/' + taskId + '/', emptyObj, this.configObj).then(function(results){
    return results;
  },function(err){
    console.log('err at taskComplete', err);
    return self.$q.reject(err);
  });
};


////////////////////////////////////// Runnner Stuff /////////////////////////////


AgentService.prototype.getRunnerAssignments = function () {
  var self = this;
  return this.$http.get(this.rootUrl + 'runner_assignments/', this.configObj).then(function(results){
    self.runnerAssignments = results.data.runner_assignments;
    this.internetProblem = false;
    return results;
  }, function(err){
    console.log('err at assignmentsService', err);
    return self.$q.reject(err);
  });
};

AgentService.prototype.acceptRunnerAssignment = function (id) {
  var self = this;
  var emptyObj = {};

  this.$ionicLoading.show(this.ionicLoadingConfig);
  return this.$http.post(this.rootUrl + 'runner_assignments/accept/' + id + '/',emptyObj, this.configObj).then(function(results) {
    self.$ionicLoading.hide();
    this.internetProblem = false;
    return results;
  }, function(err) {
    console.log('err at acceptRunnerAssignment', err);
    self.$ionicLoading.hide();
    return self.$q.reject(err);
  });
};

AgentService.prototype.completeRunnerAssignment = function (id) {
  var self = this;
  var emptyObj = {}

  this.$ionicLoading.show(this.ionicLoadingConfig);
  return this.$http.post(this.rootUrl + 'runner_assignments/complete/' + id + '/',emptyObj, this.configObj).then(function(results) {
    self.$ionicLoading.hide();
    this.internetProblem = false;
    return results;
  }, function(err) {
    console.log('err at completeRunnerAssignment', err);
    self.$ionicLoading.hide();
    return self.$q.reject(err);
  });
};