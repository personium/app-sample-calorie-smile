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
        // try to login with genkiAccessInfo.json downloaded from the server
        cs.automaticLogin();
    }
};

cs.automaticLogin = function() {
    cs.getCalorieSmileServerToken(startLoginAnimation, stopLoginAnimation, saveAccessDataAndRenderGenki);
};

/*
 * Called when login button is clicked
 */
cs.manualLogin = function() {
    startLoginAnimation();

    var tempData = {
        "Url": cs.addEndingSlash($("#iGenkikunUrl").val()),
        "Id": $("#iGenkikunId").val(),
        "Pw": $("#iGenkikunPw").val()
    }
    cs.loginGenki(tempData).done(function(data) {
        $.ajax({
            type: "PUT",
            url: cs.accessData.target + '/GenkiKunBox/genkiAccessInfo.json',
            data: JSON.stringify(tempData),
            dataType: 'json',
            headers: {
                'Authorization':'Bearer ' + cs.accessData.token,
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
    cs.displayMessageByKey("login:msg.info.loggingIn");
    $("#register").prop("disabled", true);
};

stopLoginAnimation = function(msg_key) {
    cs.displayMessageByKey(msg_key);
    $("#register").prop("disabled", false);
};

saveAccessDataAndRenderGenki = function(json, loginData) {
    cs.updateSessionStorageGenkikun(json, loginData);
    location.href = "./genki.html";
};
