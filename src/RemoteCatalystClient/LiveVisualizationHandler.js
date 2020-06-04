/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    connect: (host = "localhost", port = 22222) => {
      return session.call("catalyst.live.connect", [host, port]);
    },
    disconnect: () => {
      return session.call("catalyst.live.disconnect", []);
    },
    monitor: () => {
      return session.call("catalyst.live.monitor");
    },
    extract: (name = "input") => {
      return session.call("catalyst.live.extract", [name]);
    },
    show: (name = "input") => {
      return session.call("catalyst.live.show", [name]);
    },
    pause: (pause = true) => {
      return session.call("catalyst.live.pause", [pause]);
    },
    onConnected: (callback) =>
      session.subscribe("catalyst.live.connected", callback),
    onDisconnected: (callback) =>
      session.subscribe("catalyst.live.disconnected", callback),
    onUpdate: (callback) => session.subscribe("catalyst.live.updated", callback),
  };
}
