angular.module('kioskApp')
.factory('authService', function ($http, $q, $location, PasswordTimeoutService) {
    const fs = require('fs');
    var serviceBase = kiosk.api;
    var authServiceFactory = {};

    var _authentication = {
        isAuth: false,
        userName: ""
    };

    var _login = function (loginData) {

        var data = "grant_type=password&username=" + loginData.userName + "&password=" + loginData.password;

        var deferred = $q.defer();

        $http.post(serviceBase + 'token', data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).success(function (response) {
            var authorizationData = {
                    "token": response.access_token, 
                    "userName": loginData.userName
            } 
            var authJSON = JSON.stringify(authorizationData);

            fs.writeFile(kiosk.authFile, authJSON, function(err){
                if(err) return console.log('Auth Config Creation Error' + err);
            });

            _authentication.isAuth = true;
            _authentication.userName = loginData.userName;

            deferred.resolve(response);

        }).error(function (err, status) {
            _logOut();
            deferred.reject(err);
        });

        return deferred.promise;

    };

    var _logOut = function () {
        if(fs.existsSync(kiosk.authFile)){
            var kioskObj = JSON.parse(fs.readFileSync(kiosk.configFile,'utf8'));
            var authObj = "";
            fs.readFile(kiosk.authFile, 'utf8', function(err, data) {
                if (err) throw err;
                authObj = JSON.parse(data);

                var user = authObj.userName;
                var kioskid = kioskObj.kioskid;

                var kioskActivityRecord = {
                    KioskName: kioskid,
                    UserName: user,
                    IsActive: false
                };

                $http.post(serviceBase + 'api/kiosk/update', kioskActivityRecord).success(function (response) {
                    if(fs.existsSync(kiosk.authFile)){
                        fs.unlinkSync(kiosk.authFile);
                    }                 
                    _authentication.isAuth = false;
                    _authentication.userName = "";
                    $location.path("/");
                }).error(function (err, status) {

                });
            });
        }
        PasswordTimeoutService.ResetPasswordExpired();
    };

    var _fillAuthData = function () {
        if(fs.existsSync(kiosk.authFile)){
            var authObj = JSON.parse(fs.readFileSync(kiosk.authFile,'utf8'));
            _authentication.isAuth = true;
            _authentication.userName = authObj.userName;
        }
    }

    authServiceFactory.login = _login;
    authServiceFactory.logOut = _logOut;
    authServiceFactory.fillAuthData = _fillAuthData;
    authServiceFactory.authentication = _authentication;

    return authServiceFactory;
});