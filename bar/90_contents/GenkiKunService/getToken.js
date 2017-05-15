// トークン取得
function(request){
  // POST 以外は405
  if(request.method !== "POST") {
     return {
            status : 405,
            headers : {"Content-Type":"application/json"},
            body : ['{"error":"method not allowed"}']
     };
  }
  
  //var queryValue = request.queryString;
  //if (queryValue === "") {
  //    return {
  //           status : 400,
  //           headers : {"Content-Type":"application/json"},
  //           body : ['{"error":"required parameter not exist."}']
  //    };
  //}

  var bodyAsString = request["input"].readAll();
  if (bodyAsString === "") {
      return {
             status : 400,
             headers : {"Content-Type":"application/json"},
             body : ['{"error":"required body not exist."}']
      };
  }

  var params = dc.util.queryParse(bodyAsString);

  var dcx = {sports: {HTTP: {}}};
  var __a = new Packages.io.personium.client.PersoniumContext(pjvm.getBaseUrl(), pjvm.getCellName(), pjvm.getBoxSchema(), pjvm.getBoxName()).withToken(null);
  dcx.sports.HTTP._ra = Packages.io.personium.client.http.RestAdapterFactory.create(__a);
  var formatRes = function(dcr) {
    var resp = {body: "" + dcr.bodyAsString(), status: dcr.getStatusCode(), headers: {}};
    return resp;
  }

  // get
  dcx.sports.HTTP.get = function(url, headers) {
    if (!headers) {
    	headers = {"Accept": "text/plain"};
    }
    var dcr = dcx.sports.HTTP._ra.get(url, dc.util.obj2javaJson(headers), null);
    return formatRes(dcr);
  };
  // post 
  dcx.sports.HTTP.post = function(url, body, contentType, headers) {
    if (!headers) {
      headers = {"Accept": "text/plain"};
    }
    var dcr = dcx.sports.HTTP._ra.post(url, dc.util.obj2javaJson(headers), body, contentType);
    return formatRes(dcr);
  };

  //var urlY = params.targetUrl + "?service=calsml&func=01&id=" + params.id + "&pass=" + params.pass + "&grant_type=password";
  var urlY = params.targetUrl;
  var headersY = {};
  //var bodyY = "";
  var bodyY = "service=calsml";
  bodyY += "&func=01";
  bodyY += "&username=" + params.id;
  bodyY += "&password=" + params.pass;
  bodyY += "&grant_type=password";
  var contentTypeY = "application/x-www-form-urlencoded";
  //var contentTypeY = {};

  // エンドポイントへのPOST
  var apiRes = dcx.sports.HTTP.post(urlY, bodyY, contentTypeY, headersY);

  if (apiRes === null || apiRes.status !== 200) {
    return {
      status : apiRes.status,
      headers : {"Content-Type":"application/json"},
      body : ['{"error": {"status":' + apiRes.status + ', "message": "API call failed."}}']
    };
  }

  // resを定義
  if (apiRes.status === 200) {
    return {
      status: 200,
      headers: {"Content-Type":"application/json"},
      body: [apiRes.body]
    };
  }

  
}
