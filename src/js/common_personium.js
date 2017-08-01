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
 * The following methods should be shared amoung all cell applications.
 */
cs.approvalRel = function(extCell, uuid, msgId) {
    cs.changeStatusMessageAPI(uuid, "approved").done(function() {
        $("#" + msgId).remove();
        cs.getAllowedCellList();
        var title = i18next.t("readResponseTitle");
        var body = i18next.t("readResponseApprovedBody");
        cs.sendMessage(uuid, extCell, "message", title, body);
    });
};

cs.rejectionRel = function(extCell, uuid, msgId) {
    cs.changeStatusMessageAPI(uuid, "rejected").done(function() {
        $("#" + msgId).remove();
        cs.getAllowedCellList();
        var title = i18next.t("readResponseTitle");
        var body = i18next.t("readResponseDeclinedBody");
        cs.sendMessage(uuid, extCell, "message", title, body);
    });
};

cs.changeStatusMessageAPI = function(uuid, command) {
    var data = {};
    data.Command = command;
    return $.ajax({
            type: "POST",
            url: cs.accessData.cellUrl + '__message/received/' + uuid,
            data: JSON.stringify(data),
            headers: {
                    'Authorization':'Bearer ' + cs.accessData.token
            }
    })
};
