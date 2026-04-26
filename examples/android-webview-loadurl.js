if (!Java.available) {
  send({ event: 'skip', reason: 'Java runtime is not available in this process.' });
} else {
  Java.perform(function () {
    const WebView = Java.use('android.webkit.WebView');

    WebView.loadUrl.overload('java.lang.String').implementation = function (url) {
      send({ event: 'WebView.loadUrl', url: String(url) });
      return this.loadUrl(url);
    };

    send({ event: 'hooked', target: 'android.webkit.WebView.loadUrl(String)' });
  });
}
