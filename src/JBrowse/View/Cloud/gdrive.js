define(["dojo/_base/declare"], function(declare){
    return declare(null, {


        constructor: function(){
            this.CLIENT_ID = '506915665486.apps.googleusercontent.com';
            this.SCOPES = 'https://www.googleapis.com/auth/drive';
        },


        authorize: function(){
            alert ("asdf");
            // Called when the client library is loaded to start the auth flow.
            window.setTimeout(this.checkAuth, 1);
        },


        // Check if the current user has authorized the application.
        checkAuth: function() {
            this.gapi.auth.authorize(
                {'client_id': this.CLIENT_ID, 'scope': this.SCOPES, 'immediate': true},
                this.handleAuthResult);
        },


        // Called when authorization server replies.
        // @param {Object} authResult Authorization result.
        handleAuthResult: function(authResult) {
            var authButton = document.getElementById('authorizeButton');
            authButton.style.display = 'none';
//            filePicker.style.display = 'none';
            if (authResult && !authResult.error) {
                // Access token has been successfully retrieved, requests can be sent to the API.
//                filePicker.style.display = 'block';
//                filePicker.onchange = uploadFile;
                alert("pre authorized");
            } else {
                // No access token could be retrieved, show the button to start the authorization flow.
                authButton.style.display = 'block';
                authButton.onclick = function() {
                this.gapi.auth.authorize(
                    {'client_id': this.CLIENT_ID, 'scope': this.SCOPES, 'immediate': false},
                    this.handleAuthResult);
                alert("auth");
                };
            }
        }
    });
});

