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
    Common.accessData = JSON.parse(sessionStorage.getItem("Common.accessData"));
    cs.accessData = JSON.parse(sessionStorage.getItem("cs.accessInfo"));
    cs.accessData.skip = 0;
    cs.accessData.top = 50;

    Common.setIdleTime();
    dispPhoto();
    $('#photoTitle')
        .attr('data-i18n', 'glossary:photosOfMealsOf')
        .localize({
            title: cs.accessData.Title
        });
};

function dispPhoto() {
    var skip = cs.accessData.skip;
    var top = cs.accessData.top;
    $('#dvMainArea').empty();
    getPhotoAPI(skip, top).done(function(data) {
        var dataList = data.d.results;
        var html = "";
        var nowDate = "";

        for (var i in dataList) {
            var imageSrc = dataList[i].photo;
            var imageName = "";
            if (imageSrc) {
                imageName = imageSrc.match(".+/(.+?)([\?#;].*)?$")[1];
            }
            var shokujiDate = dataList[i].shokuji_date;
            var dateId = shokujiDate.replace(/\//g, "");
            var shokujiTime = dataList[i].time;
            var timeId = shokujiTime.replace(/:/g, "");
            var dispTimeS = shokujiTime.split(':');
            var dispTime = dispTimeS[0] + ":" + dispTimeS[1];
            var noId = dataList[i].no;

            var html = '';
            if (nowDate !== shokujiDate) {
                nowDate = shokujiDate;
                html = '<section class="meal-section"><h2>' + nowDate.replace(/\//g, ".") + '</h2><div class="daily-meal" id="td' + dateId + '"></div></section>';

                $('#dvMainArea').append(html);
            }

            var comm = dataList[i].shokuji_comment;
            if (!comm) {
                comm = "";
            }
            var imageId = ["im", dateId, timeId, noId].join("");
            html = [
                '<div class="meal">',
                    '<div class="picture">',
                        '<img id="' + imageId + '" alt="' + i18next.t("glossary:food") + '">',
                    '</div>',
                    '<div class="time">',
                        dispTime,
                    '</div>',
                    '<div class="comment">',
                        comm,
                    '</div>',
                '</div>'
            ].join("");

            $("#td" + dateId).append(html);
            setPhoto(dateId, timeId, noId, imageName);
        }

        if (dataList.length > 0) {
            $('#dvMainArea').css("display", "block");
        } else {
            Common.displayMessageByKey("msg.error.dataNotFound");
        }
    }).fail(function(data) {
        Common.displayMessageByKey("msg.error.dataNotFound");
    });
}

function setPhoto(dateId, timeId, noId, imageName) {
    var ext = imageName.split('.')[1];
    var contentType = "image/jpeg";
    switch (ext) {
        case "png":
            contentType = "image/png";
            break;
        case "gif":
            contentType = "image/gif";
            break;
    }
    var filePath = cs.accessData.photoCell + 'Images/' + imageName;
    var oReq = new XMLHttpRequest();
    oReq.open("GET", filePath);
    oReq.responseType = "blob";
    oReq.setRequestHeader("Content-Type", contentType);
    oReq.setRequestHeader("Authorization", "Bearer " + cs.accessData.photoToken);
    oReq.onload = function(response) {
        var blob = oReq.response;
        var file = new File([blob], imageName);
        try {
            var reader = new FileReader();
        } catch (e) {
            return;
        }

        reader.onload = function(event) {
            //$("#im" + dateId + timeId + noId).css('background-image','url(\'' + event.target.result + '\')');
            $("#im" + dateId + timeId + noId).attr('src',event.target.result);
        }
        reader.readAsDataURL(file, "UTF-8");
    }
    oReq.send();
};

function getPhotoAPI(skip, top) {
    var id = cs.accessData.id;
    return $.ajax({
        type: 'GET',
        url: cs.accessData.photoCell + 'GenkiKunData/shokuji_info?$skip=' + skip + '&$top=' + top + '&$orderby=shokuji_date%20desc,time%20asc,no%20asc',
        headers: {
            'Authorization':'Bearer ' + cs.accessData.photoToken,
            'Accept':'application/json'
        }
    });
}
