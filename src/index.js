import "normalize.css";

import SmartConnect from "wslink/src/SmartConnect";

import RemoteRenderer from "paraviewweb/src/NativeUI/Canvas/RemoteRenderer";

import LiveVisualizationHandler from "catalyst-web/src/RemoteCatalystClient/LiveVisualizationHandler";

import SizeHelper from "paraviewweb/src/Common/Misc/SizeHelper";
import ParaViewWebClient from "paraviewweb/src/IO/WebSocket/ParaViewWebClient";

document.body.style.padding = "0";
document.body.style.margin = "0";

const divRenderer = document.createElement("div");
document.body.appendChild(divRenderer);

divRenderer.style.position = "relative";
divRenderer.style.width = "100vw";
divRenderer.style.height = "100vh";
divRenderer.style.overflow = "hidden";

const config = { sessionURL: "ws://localhost:1234/ws" }; // TODO: should be configurable

const smartConnect = SmartConnect.newInstance({ config });

let intervalId = null;
const clearIntervalCb = () => {
  clearInterval(intervalId);
  intervalId = null;
};

smartConnect.onConnectionReady((connection) => {
  const pvwClient = ParaViewWebClient.createClient(
    connection,
    ["MouseHandler", "ViewPort", "ViewPortImageDelivery", "ProxyManager"],
    { LiveVisualizationHandler }
  );
  const renderer = new RemoteRenderer(pvwClient);
  renderer.setContainer(divRenderer);
  renderer.onImageReady(() => {
    console.log("We are good");
  });
  console.log("client", pvwClient);
  window.renderer = renderer;
  SizeHelper.onSizeChange(() => {
    renderer.resize();
  });
  SizeHelper.startListening();

  // Connect catalyst
  pvwClient.LiveVisualizationHandler.connect('localhost', 22222).then((result = null) => {
    intervalId = setInterval(pvwClient.LiveVisualizationHandler.monitor, 50);
    pvwClient.LiveVisualizationHandler.onConnected(([{ source }]) => {
      console.log("Catalyst connected", source);
      renderer.render();
    });
    pvwClient.LiveVisualizationHandler.onDisconnected(() => {
      console.log("Catalyst disconnected");
      clearIntervalCb();
    });
  });
});

smartConnect.onConnectionClose(clearIntervalCb);
smartConnect.onConnectionError(clearIntervalCb);

smartConnect.connect();
