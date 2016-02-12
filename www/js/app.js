



// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

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

.controller('assignmentsListController', AssignmentsCtrl)
.controller('logInCtrl', LogInCtrl)
.service('agentService', AgentService)

//routing for different views in driverApp
.config(function($stateProvider, $urlRouterProvider, $httpProvider){
  $stateProvider
    .state('assignmentsList', {
      url: '/',
      controller: 'assignmentsListController as assignmentsCtrl',
      templateUrl: 'assignmentsList.html',
      resolve: {
        getInitialStatus: function(agentService) {
          return agentService.getStatus();
        },
        getInitialAssignments: function(agentService){
          return agentService.getAssignments();
        }
      }
    })
    .state('logIn',{
      url: '/logIn',
      controller: 'logInCtrl as logInCtrl',
      templateUrl: 'logIn.html'
    });

  $urlRouterProvider.otherwise('/logIn');

})


//Service for logging in, getting assignments, updating, etc.
function AgentService ($http, $q) {
  this.$q = $q;
  this.$http = $http;
  this.hostUrl = 'https://sandbox.menu.me/'
  this.rootUrl = this.hostUrl + 'foodcannon/non-fleet/agent/';
  
  this.auth = "Token BC04DM5Q-Qjlzk9SrtoZRCcRvbYYsomuVUuqzO8yHi3vl9jS7sKhBd3bRTl7ELhKwmrfpXeqXQQZC";


  this.clusters = [];

  this.assignments = [];

  this.configObj = {
    headers: {
      "Authorization": this.auth,
      "Content-Type": 'text/plain'}
  }

}

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

  var emptyData = {};

  return this.$http.post(this.rootUrl + groupId + '/' + on_duty + '/', emptyData, this.configObj).then(function(results){
    console.log('post status results', results);
    return self.getAssignments();
  })
};

//Controller for the assignmentList views
function AssignmentsCtrl (agentService, $ionicSideMenuDelegate) {
  this.$ionicSideMenuDelegate = $ionicSideMenuDelegate;
  this.agentService = agentService;

  this.assignments = [
    {dropOff: "8:15pm"}
  ];
}

AssignmentsCtrl.prototype.toggleSideMenu = function () {
  this.$ionicSideMenuDelegate.toggleLeft();
};

AssignmentsCtrl.prototype.toggleDuty = function (cluster) {
  this.agentService.postStatus(cluster).then(function(results){
    console.log('results from toggleDuty', results);
  });
  this.toggleSideMenu();
};


//Controller for the logInView
function LogInCtrl (agentService, $location) {
  this.$location = $location;
  this.agentService = agentService;

  this.logInField = {
    email : 'matt@menu.me',
    password: 'handsoff9'
  }
}

LogInCtrl.prototype.logIn = function () {
  var self = this;
  this.agentService.logIn(this.logInField).then(function(results){
    console.log('results from Ctrl', results);
    self.$location.path('/')
  }, function(err){
    console.log('err at logInCtrl', err);
  });
};