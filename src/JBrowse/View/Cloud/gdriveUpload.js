define(["dojo/_base/declare"], function(declare){
    return declare(null, {


        constructor: function(){ },

        uploadFile: function(data, callback) {
            console.debug("keys for 'this' : " + Object.keys(this));
            gapi.client.load('drive', 'v2', function() {
                dojo.hitch(this, "insertFile", data, callback);
            });
        },

        /**
         * Insert new file.
         *
         * @param {File} fileData File object to read data from.
         * @param {Function} callback Function to call when the request is complete.
         */
        insertFile: function(fileData, callback) {
            alert("wrasassadw fqwetgb4yewgsa';,vckfri28#hyqe[t&okri48t^iurnhjcnz!~kfhw ckivnbrejuefj");
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";
            console.log ("running insertFile");
            var contentType = fileData.type || 'application/octet-stream';
            var metadata = {
                'title': fileData.name,
                'mimeType': contentType
            };

            var base64Data = btoa(fileData.data);
            var multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                base64Data +
                close_delim;

            var request = gapi.client.request({
                'path': '/upload/drive/v2/files',
                'method': 'POST',
                'params': {'uploadType': 'multipart'},
                'headers': {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody});

            if (!callback) {
                callback = function(fileData) {
                    console.log(fileData.name + ': ' + fileData.data);
                };
            }
            request.execute(callback);
        }
    });
});
