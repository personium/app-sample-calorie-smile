// データ取得
function(request){
  // GET 以外は405
  if(request.method !== "GET") {
     return {
            status : 405,
            headers : {"Content-Type":"application/json"},
            body : ['{"error":"method not allowed"}']
     };
  }
  
  var queryValue = request.queryString;
  if (queryValue === "") {
      return {
             status : 400,
             headers : {"Content-Type":"application/json"},
             body : ['{"error":"required parameter not exist."}']
      };
  }
  var params = dc.util.queryParse(queryValue);

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

  var prevDate = params.prevDate;
  if (prevDate.length > 0) {
      prevDate = "=" + prevDate;
  }
  var urlY = params.targetUrl + "?service=calsml&func=02&username=" + params.id + "&startdate" + prevDate + "&enddate=" + params.nowDate;
  var headersY = {"Authorization": "Bearer " + params.genkiToken};
  var bodyY = {};
  var contentTypeY = {};

  // エンドポイントへのGET
  var apiRes = dcx.sports.HTTP.get(urlY, headersY);

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
