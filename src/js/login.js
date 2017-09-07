/**
 * Personium
 * Copyright 2017 FUJITSU LIMITED
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

additionalCallback = function() {
    Common.setAppCellUrl();
    
    Common.setAccessData();

    if (!Common.checkParam()) {
        // cannot do anything to recover
        // display a dialog and close the app.
        return;
    };

    Common.setIdleTime();
    // try to login with genkiAccessInfo.json downloaded from the server
    automaticLogin();
};

/*
 * Peform the followings:
 * 1. retrieve login info (Calorie Smile server) from user's cell
 * 2. login to Calorie Smile server and receive a token
 * 3. save the token to session storage so that genki.html can use it
 */
automaticLogin = function() {
    cs.getCalorieSmileServerToken(startLoginAnimation, stopLoginAnimation, saveAccessDataAndRenderGenki);
};

/*
 * Called when login button is clicked
 */
manualLogin = function() {
    startLoginAnimation();

    var tempData = {
        "Url": cs.addEndingSlash($("#iGenkikunUrl").val()),
        "Id": $("#iGenkikunId").val(),
        "Pw": $("#iGenkikunPw").val()
    }
    cs.loginGenki(tempData).done(function(data) {
        $.ajax({
            type: "PUT",
            url: Common.getTargetUrl() + '/GenkiKunBox/genkiAccessInfo.json',
            data: JSON.stringify(tempData),
            dataType: 'json',
            headers: {
                'Authorization':'Bearer ' + Common.getToken(),
                'Accept':'application/json'
            }
        }).done(function(res) {
            saveAccessDataAndRenderGenki(data, tempData);
        }).fail(function(res) {
            stopLoginAnimation("login:msg.error.failedToSaveData");
        });
    }).fail(function(data) {
        stopLoginAnimation("login:msg.error.failedToLogin");
    });
};

startLoginAnimation = function() {
    Common.displayMessageByKey("login:msg.info.loggingIn");
    $("#register").prop("disabled", true);
};

stopLoginAnimation = function(msg_key) {
    Common.displayMessageByKey(msg_key);
    $("#register").prop("disabled", false);
};

saveAccessDataAndRenderGenki = function(json, loginData) {
    cs.updateSessionStorageGenkikun(json, loginData);
    location.href = "./genki.html";
};
