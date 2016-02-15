angular.module('agentService',['ionic'])
	.service('agentService', AgentService);

//Service for logging in, getting assignments, updating, etc.
function AgentService ($http, $q, $location, $interval) {
  this.$q = $q;
  this.$http = $http;
  this.$location = $location;
  this.$interval = $interval;
  this.hostUrl = 'https://sandbox.menu.me/'
  this.rootUrl = this.hostUrl + 'foodcannon/non-fleet/agent/';
  
  this.auth = "Token BC04DM5Q-Qjlzk9SrtoZRCcRvbYYsomuVUuqzO8yHi3vl9jS7sKhBd3bRTl7ELhKwmrfpXeqXQQZC";


  this.clusters = [];

  this.assignments = [];

  this.activeAssignment;

  this.intervalCheck;

  this.timeStamp = '';

  this.configObj = {
    headers: {
      "Authorization": this.auth,
      "Content-Type": 'text/plain'}
  }

}



//Check cache for Token..Check for logged in

//Check if on-duty
////// Start update interval
////// check if active assignment
///////////////go to active assignment

AgentService.prototype.logIn = function (logInInfo) {
  var self= this;
  var logInUrl = 'api/1/auth/';

  return this.$http.post(this.hostUrl + logInUrl, logInInfo, this.configObj).then(function(results){
    console.log('logIn Results', results);
    self.configObj.headers['Bearer'] = results.data.auth_token;
    return results;
  },function(err){
    console.log('err at logInService', err);
    return self.$q.reject(err);
  });

};

AgentService.prototype.getAssignments = function () {
  var self = this;

  return this.$http.get(this.rootUrl + 'tasks/', this.configObj).then(function(results){
    console.log('assignments Results', results);
    self.assignments = results.data.assignments;
    self.checkForActive();
    return results;
  }, function(err){
    console.log('err at assignmentsService', err);
    return self.$q.reject(err);
  });
};

AgentService.prototype.getStatus = function () {
  var self = this;

  return this.$http.get(this.rootUrl + 'status/', this.configObj).then(function(results){
    console.log('get status results', results);
    self.clusters = results.data.groups;
    return results;
  });
};

AgentService.prototype.postStatus = function (cluster) {
  var self = this;

  var groupId = cluster.id;

  var on_duty = cluster.on_duty == 1 ? 0 : 1;

  cluster.on_duty = on_duty;

  var emptyData = {};

  return this.$http.post(this.rootUrl + groupId + '/' + on_duty + '/', emptyData, this.configObj).then(function(results){
    console.log('post status results', results);
    if (self.checkForOnDuty()){
    	self.startIntervalCheck();
    	self.getAssignments();
    } else {
    	self.stopIntervalCheck();
    	self.assignments = [];
    }
  })
};

AgentService.prototype.checkForActive = function () {
	if(angular.isDefined(this.assignments[0])){
	  if(this.assignments[0].active){
	    this.activeAssignment = this.assignments[0];
	    this.$location.path('/activeAssignment');
	  }
	}
};

AgentService.prototype.checkForOnDuty = function () {
	for (var i in this.clusters){
		if(this.clusters[i].on_duty){
			return true;
		}
	}
	return false;
};

AgentService.prototype.checkForChanges = function () {
	var self = this;
	var updateObj = {
		lat: '',
		lng: '',
		update: this.timeStamp
	};

	return this.$http.post(this.rootUrl + 'checkin/', updateObj, this.configObj).then(function(result){
		console.log('result from checkForChanges', result);
		self.timeStamp = result.data.update;
		if (result.data.refresh) {
			self.getAssignments();
		}
	});
};

AgentService.prototype.startIntervalCheck = function () {
	var self = this;

	if (angular.isDefined(this.intervalCheck)){
		return;
	}

	this.intervalCheck = this.$interval(function(){
		self.checkForChanges();
	}, 15000);
};


AgentService.prototype.stopIntervalCheck = function () {
	if (angular.isDefined(this.intervalCheck)) {
		this.$interval.cancel(this.intervalCheck);
		this.intervalCheck = undefined;
	}
};

AgentService.prototype.assignmentAction = function (assignmentId, action) {
	var emptyObj = {};

	return this.$http.post(this.rootUrl + 'assignments/' + action + assignmentId + '/', emptyObj, this.configObj).then(function(results){
		console.log('accept assignment', results);
		return results;
	})
};


