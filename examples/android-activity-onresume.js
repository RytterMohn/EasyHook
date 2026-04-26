if (!Java.available) {
  send({ event: 'skip', reason: 'Java runtime is not available in this process.' });
} else {
  Java.perform(function () {
    const Activity = Java.use('android.app.Activity');

    Activity.onResume.implementation = function () {
      const className = this.getClass().getName();
      send({ event: 'Activity.onResume', className: className });
      return this.onResume();
    };

    send({ event: 'hooked', target: 'android.app.Activity.onResume' });
  });
}
