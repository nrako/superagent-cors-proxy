superagent-cors-proxy
=====================

Superagent extension to perform CORS requests via an iframe proxy for old IE :gun:.

XDomainRequest === :poop: - :smile:

This will automatically proxy all cross-domain requests via a proxy. This use postMessage to communicate to the iframe/parent passed in argument.

## Notes

It doesn't supports multiple proxy/iframe yet. Hence, multiple cross-domain urls.

It won't try to perform CORS, it's your duty to use that only when it's necessary.

## Usage

### Shim Client

In a shim IE <10 version.

```javascript
var request     = require('superagent');
var iframe = document.createElement('iframe');
var proxy = require('superagent-cors-proxy')(request, iframe);

proxy.onReady(function () {
  // proxied superagent ready
}.bind(this));

iframe.src = 'https://api.example.com/proxy/';
iframe.setAttribute('style', 'display:none;');
document.body.appendChild(iframe);
```

### Javascript file to add to proxy page

```javascript
var request = require('superagent');

require('superagent-cors-proxy')(request, null, window.parent);

```

## License

MIT
