send({
  event: 'hello',
  pid: Process.id,
  platform: Process.platform,
  arch: Process.arch
});

rpc.exports = {
  ping(value) {
    return 'pong: ' + value;
  }
};
