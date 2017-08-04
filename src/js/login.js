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
$(document).ready(function() {
    i18next
    .use(i18nextXHRBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
        fallbackLng: 'en',
        ns: ['common', 'login', 'glossary'],
        defaultNS: 'common',
        debug: true,
        backend: {
            // load from i18next-gitbook repo
            loadPath: './locales/{{lng}}/{{ns}}.json',
            crossDomain: true
        }
    }, function(err, t) {
        initJqueryI18next();
        
        cs.appendSessionExpiredDialog();
        cs.additionalCallback();
        
        updateContent();
    });
});

cs.additionalCallback = function() {
    var hash = location.hash.substring(1);
    var params = hash.split("&");
    for (var i in params) {
        var param = params[i].split("=");
        var id = param[0];
        var value = param[1];
        switch (id) {
            case "target":
                cs.accessData.target = value;
                var urlSplit = value.split("/");
                cs.accessData.cellUrl = urlSplit[0] + "//" + urlSplit[2] + "/" + urlSplit[3] + "/";
                var split = cs.accessData.target.split("/");
                cs.accessData.boxName = split[split.length - 1];
                break;
            case "token":
                cs.accessData.token = value;
                break;
            case "ref":
                cs.accessData.refToken = value;
                break;
            case "expires":
                cs.accessData.expires = value;
                break;
            case "refexpires":
                cs.accessData.refExpires = value;
                break;
        }
    }

    if (cs.checkParam()) {
        cs.setIdleTime();
        cs.automaticLogin(); // try to login with genkiAccessInfo.json downloaded from the server
    }
};

cs.automaticLogin = function() {
    cs.startLoginAnimation();
    cs.getGenkiAccessInfoAPI().done(function(json) {
        if ($.isEmptyObject(json)) {
            // Strange info
            // Stop animation without displaying any error
            cs.stopLoginAnimation();
            return;
        };

        var allInfoValid = true;
        var tempData = JSON.parse(json);
        
        $.each(tempData, function(key, value) {
            if (value.length > 0) {
                // Fill in the login form
                $('#iGenkikun' + key).val(value);
            } else {
                allInfoValid = false;
            }
        });

        // Not enough info to login automatically.
        // Stop animation without displaying any error
        if (!allInfoValid) {
            cs.stopLoginAnimation();
            return;
        }

        cs.loginGenki(tempData).done(function(data) {
            cs.transGenki(data);
        }).fail(function(data) {
            cs.stopLoginAnimation("login:msg.error.failedToLogin");
        });
    }).fail(function() {
        // Stop animation without displaying any error
        cs.stopLoginAnimation();
    });
};

/*
 * Called when login button is clicked
 */
cs.manualLogin = function() {
    cs.startLoginAnimation();

    var tempData = {
        "Url": $("#iGenkikunUrl").val(),
        "Id": $("#iGenkikunId").val(),
        "Pw": $("#iGenkikunPw").val()
    }
    cs.loginGenki(tempData).done(function(data) {
        saveData = {
            "Url": $("#iGenkikunUrl").val(),
            "Id":$("#iGenkikunId").val(),
            "Pw":$("#iGenkikunPw").val()
        };
        $.ajax({
            type: "PUT",
            url: cs.accessData.target + '/GenkiKunBox/genkiAccessInfo.json',
            data: JSON.stringify(saveData),
            dataType: 'json',
            headers: {
                'Authorization':'Bearer ' + cs.accessData.token,
                'Accept':'application/json'
            }
        }).done(function(res) {
            cs.transGenki(data);
        }).fail(function(res) {
            cs.stopLoginAnimation("login:msg.error.failedToSaveData");
        });
    }).fail(function(data) {
        cs.stopLoginAnimation("login:msg.error.failedToLogin");
    });
};

cs.startLoginAnimation = function() {
    cs.displayMessageByKey("login:msg.info.loggingIn");
    $("#register").prop("disabled", true);
};

cs.stopLoginAnimation = function(msg_key) {
    cs.displayMessageByKey(msg_key);
    $("#register").prop("disabled", false);
};

cs.loginGenki = function(tempData) {
    var url = tempData.Url;
    if (url.slice(-1) != "/") {
        url += "/";
    }
    $("#iGenkikunUrl").val(url);
    var id = tempData.Id;
    var pw = tempData.Pw;
    return $.ajax({
        type: "POST",
        //url: cs.accessData.target + '/GenkiKunService/getToken?targetUrl=' + url + 'newpersonium/Response&id=' + id + '&pass=' + pw,
        url: cs.accessData.target + '/GenkiKunService/getToken',
        data: {
            'targetUrl': url + 'newpersonium/Response',
            'id': id,
            'pass': pw
        },
        headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + cs.accessData.token
        }
    });
};

cs.transGenki = function(json) {
    cs.accessData.id = $("#iGenkikunId").val();
    cs.accessData.genkiUrl = $("#iGenkikunUrl").val();
    cs.accessData.genkiToken = json.access_token;
    cs.accessData.genkiexpires = json.expires_in;
    sessionStorage.setItem("accessInfo", JSON.stringify(cs.accessData));

    location.href = "./genki.html";
};
