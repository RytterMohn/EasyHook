const candidates = ['open', 'open64', '_open'];
const exportName = candidates.find(function (name) {
  return Module.findGlobalExportByName(name) !== null;
});

if (!exportName) {
  send({ event: 'skip', reason: 'No open/open64/_open export found.' });
} else {
  Interceptor.attach(Module.getGlobalExportByName(exportName), {
    onEnter(args) {
      try {
        this.path = args[0].readUtf8String();
      } catch (error) {
        this.path = '<unreadable>';
      }
    },
    onLeave(retval) {
      send({
        event: exportName,
        path: this.path,
        retval: retval.toString()
      });
    }
  });

  send({ event: 'hooked', target: exportName });
}
