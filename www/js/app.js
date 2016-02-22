



// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'activeCtrl', 'agentService'])

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
    })
    .state('activeAssignment',{
      url: '/activeAssignment',
      controller: 'activeCtrl as activeCtrl',
      templateUrl: 'activeAssignment.html'
    })

  $urlRouterProvider.otherwise('/logIn');

})




////////////////////////////////Controller for the assignmentList views///////////////////////
function AssignmentsCtrl (agentService, $ionicSideMenuDelegate, $location) {
  this.$ionicSideMenuDelegate = $ionicSideMenuDelegate;
  this.$location = $location;
  this.agentService = agentService;

  this.selectedAssignment;
}

AssignmentsCtrl.prototype.toggleSideMenu = function () {
  this.$ionicSideMenuDelegate.toggleLeft();
};

AssignmentsCtrl.prototype.toggleDuty = function (cluster) {
  this.agentService.postStatus(cluster);
  this.toggleSideMenu();
};

AssignmentsCtrl.prototype.toggleSelectAssignment = function(assignment){
  if(assignment == this.selectedAssignment){
    this.selectedAssignment = undefined;
  } else {
    this.selectedAssignment = assignment;
  }
  console.log('this.selectedAssignment', this.selectedAssignment);
};

AssignmentsCtrl.prototype.isSelected = function () {
  return this.selectedAssignment ? true :false;
};

AssignmentsCtrl.prototype.acceptAssignment = function () {
  var self = this;
  var assignmentId = this.selectedAssignment.id;

  this.agentService.assignmentAction(assignmentId, 'accept/').then(function(results){
    self.agentService.getAssignments();
    self.selectedAssignment = undefined;
    self.$location.path('/activeAssignment')
  })
};


////////////////////////////////////Controller for the logInView///////////////////////////
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