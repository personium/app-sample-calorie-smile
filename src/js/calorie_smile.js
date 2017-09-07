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
 
/*
 * The followings should be shared among applications and/or within the same application.
 */
var cs = {};

cs.accessData = {};

const APP_URL = "https://demo.personium.io/hn-app-genki/";

// Please add file names (with file extension) 
getNamesapces = function(){
    return ['common', 'glossary', 'login'];
};

getAppReadRelation = function() {
    return 'ShokujiViewer';
};

getAppDataPath = function() {
    return '/GenkiKunData/shokuji_info?$top=1';
};

getAppRequestInfo = function() {
    return {
        headers: {
            'Accept':'application/json'
        }
    }
};

/*
 * clean up data for Calorie Smile
 */
cleanUpData = function() {
    sessionStorage.removeItem("Common.accessData");
    sessionStorage.removeItem("cs.accessInfo");
};

cs.updateSessionStorageGenkikun = function(json, loginData) {
    cs.accessData.id = loginData.Id;
    cs.accessData.genkiUrl = loginData.Url;
    cs.accessData.genkiToken = json.access_token;
    cs.accessData.genkiexpires = json.expires_in;
    sessionStorage.setItem("cs.accessInfo", JSON.stringify(cs.accessData));
};

cs.getCalorieSmileServerToken = function(startAnimation, stopAnimation, loginSucceedCallback) {
    if ($.isFunction(startAnimation)) {
        startAnimation();
    }
    cs.getGenkiAccessInfoAPI().done(function(json) {
        if ($.isEmptyObject(json)) {
            // Strange info
            // Stop animation without displaying any error
            if ($.isFunction(stopAnimation)) {
                stopAnimation();
            }
            return;
        };

        var allInfoValid = true;
        var tempData = JSON.parse(json);
        
        $.each(tempData, function(key, value) {
            if (value.length > 0) {
                // Fill in the login form
                tempData[key] = cs.updateGenkikunFormData(key, value);
            } else {
                allInfoValid = false;
            }
        });

        // Not enough info to login automatically.
        // Stop animation without displaying any error
        if (!allInfoValid) {
            if ($.isFunction(stopAnimation)) {
                stopAnimation();
            }
            return;
        }

        cs.loginGenki(tempData).done(function(data) {
            if ($.isFunction(loginSucceedCallback)) {
                loginSucceedCallback(data, tempData);
            }
        }).fail(function(data) {
            if ($.isFunction(stopAnimation)) {
                stopAnimation("login:msg.error.failedToLogin");
            }
        });
    }).fail(function() {
        // Stop animation without displaying any error
        if ($.isFunction(stopAnimation)) {
            stopAnimation();
        }
    });
};

/*
 * Get login information (Url/Id/Pw) from user's cell
 * to avoid saving data in local storage.
 * Url: Calorie Smile server's URL
 * Id:  User ID
 * Pw:  User password
 */
cs.getGenkiAccessInfoAPI = function() {
    return $.ajax({
        type: "GET",
        url: Common.getTargetUrl() + '/GenkiKunBox/genkiAccessInfo.json',
        dataType: "text",
        headers: {
            'Authorization':'Bearer ' + Common.getToken(),
            'Accept':'application/text'
        }
    });
};

/*
 * login and receive the server's token
 */
cs.loginGenki = function(tempData) {
    var url = tempData.Url;
    var id = tempData.Id;
    var pw = tempData.Pw;
    return $.ajax({
        type: "POST",
        url: Common.getTargetUrl() + '/GenkiKunService/getToken',
        data: {
            'targetUrl': url + 'newpersonium/Response',
            'id': id,
            'pass': pw
        },
        headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + Common.getToken()
        }
    });
};

cs.updateGenkikunFormData = function(key, value) {
    var tempValue = value;
    if (key == "Url") {
        tempValue = cs.addEndingSlash(value);
    }
    $('#iGenkikun' + key).val(tempValue);
    return tempValue;
};

cs.addEndingSlash = function(url) {
    var tempValue = url;
    if (url.slice(-1) != "/") {
        tempValue += "/";
    }

    return tempValue;
};
