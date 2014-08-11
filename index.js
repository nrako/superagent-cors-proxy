

module.exports = function (superagent, iframe, parent) {

  if (iframe !== null && !(iframe instanceof HTMLElement && iframe.tagName.toLowerCase() === 'iframe'))
    throw new Error('Second argument must be an iframe DOMElement or be null');

  if (typeof(parent) !== 'undefined' && (!parent.window || parent.window !== parent))
    throw new Error('Third argument must the window parent or be undefined');

  if (!iframe && !parent || iframe && parent)
    throw new Error('Second or third argument must defined');


  var uuid = function () {
    var u = 'uxxxx-wxxxx-rxxxx-xxxxx-xxxxx'.replace(/[xy]/g,
    function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); //jshint ignore:line
      return v.toString(16);
    });
    return u;
  };

  var msgPrefix = 'SACP:';
  var rePrefix = /^SACP:/;
  var noop = function () {};
  var ready = function () {};
  var corsRequests = {};
  var rePrivate = /^_/;
  var ignores = ['xhr', 'req'];

  /**
   * Module dependencies.
   */

  var Request = superagent.Request;

  /**
   * Overrides .end() to proxy request
   */

  var oldEnd = Request.prototype.end;

  if (iframe) {
    Request.prototype.end = function (fn) {
      var hostnameMatch = this.url.match(/http[s]?:\/\/([^\/]*)/);

      if (hostnameMatch && hostnameMatch[1] === window.location.hostname) {
        oldEnd.apply(this, arguments);
        return this;
      }

      this._callback = fn || noop;

      var id = uuid();

      var r = {
        id: id,
        method: this.method,
        url: this.url,
        query: this._query,
        timeout: this._timeout,
        data: this._data,
        header: this.header
      };

      var msg = JSON.stringify(r);

      r._this = this;

      corsRequests[id] = r;

      iframe.contentWindow.postMessage(msgPrefix + msg, '*');
    };
  }

  if (parent) {

    var proxyResponse = function (id, err, res) {
      var a = {
        id: id
      };

      if (err) {
        a.err = {};
        for (var p in err) {
          if (rePrivate.test(p) || ignores.indexOf(k) >= 0)
            continue;

          a.err[p] = err[p];
        }
      }

      if (res) {
        a.res = {};
        for (var k in res) {
          if (rePrivate.test(k) || ignores.indexOf(k) >= 0)
            continue;

          a.res[k] = res[k];
        }
      }

      parent.postMessage(msgPrefix + JSON.stringify(a), '*');
    };

    parent.postMessage(msgPrefix + JSON.stringify({'event': 'ready'}), '*');
  }


  window.addEventListener('message', function (msg) {
    if (!rePrefix.test(msg.data))
      return;

    var r = JSON.parse(msg.data.substr(msgPrefix.length));

    if (parent) {
      var req = superagent(r.method, r.url)
        .query(r.query)
        .timeout(r.timeout)
        .send(r.data)
        .set(r.header);

      req.end(function (err, res) {
        proxyResponse(r.id, err, res);
      });
    }

    if (iframe) {
      if (r.event === 'ready')
        return ready.call(null);

      var b = corsRequests[r.id];

      if (!b)
        return console.warn('not found request ' + r.id, r);

      b._this.callback.call(b._this, r.err, r.res);

      delete corsRequests[r.id];
    }
  });


  return {
    onReady: function (cb) {
      ready = cb;
    }
  };

};
