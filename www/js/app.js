

//Main module that everything is based off of
angular.module('starter', ['ionic','ionic.service.core', 'activeCtrl', 'agentService'])

.run(function($ionicPlatform, $location) {
  $ionicPlatform.ready(function() {

    var push = new Ionic.Push({
      "debug": true
    });

    push.register(function(token){
      console.log('Device token', token.token);
    });
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
      url: '/list',
      controller: 'assignmentsListController as assignmentsCtrl',
      templateUrl: 'assignmentsList.html',
      resolve: {
        getInitialStatus: function(agentService, $window) {
          agentService.configObj = JSON.parse($window.localStorage.getItem('configObj'));
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

//Shows or hides side menu
AssignmentsCtrl.prototype.toggleSideMenu = function () {
  this.$ionicSideMenuDelegate.toggleLeft();
};

//Tells server if user is on duty or off
AssignmentsCtrl.prototype.toggleDuty = function (cluster) {
  this.agentService.postStatus(cluster);
  this.toggleSideMenu();
};

//Toggle select and isSelected are for changing the view to see the details of the order
AssignmentsCtrl.prototype.toggleSelectAssignment = function(assignment){
  if(assignment == this.selectedAssignment){
    this.selectedAssignment = undefined;
  } else {
    this.selectedAssignment = assignment;
  }
};

AssignmentsCtrl.prototype.isSelected = function () {
  return this.selectedAssignment ? true :false;
};

//Tells the server that a user is taking an assignment
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
function LogInCtrl (agentService, $location, $window) {
  this.$location = $location;
  this.agentService = agentService;

  //Checks to see if the user has already been authenticated in the past
  if ($window.localStorage['configObj']){
    this.$location.path('/list');
  }

  this.logInField = {
    email : 'matt@menu.me',
    password: 'handsoff9'
  }
}

//Passes email and password to server
LogInCtrl.prototype.logIn = function () {
  var self = this;
  this.agentService.logIn(this.logInField).then(function(results){
    self.$location.path('/list')
  }, function(err){
    console.log('err at logInCtrl', err);
  });
};