import "normalize.css";

import SmartConnect from "wslink/src/SmartConnect";

import RemoteRenderer from "paraviewweb/src/NativeUI/Canvas/RemoteRenderer";

import LiveVisualizationHandler from "catalyst-web/src/RemoteCatalystClient/LiveVisualizationHandler";

import SizeHelper from "paraviewweb/src/Common/Misc/SizeHelper";
import ParaViewWebClient from "paraviewweb/src/IO/WebSocket/ParaViewWebClient";

import configuration from "./configuration";

document.body.style.padding = "0";
document.body.style.margin = "0";

const divRenderer = document.createElement("div");
document.body.appendChild(divRenderer);

divRenderer.style.position = "relative";
divRenderer.style.width = "100vw";
divRenderer.style.height = "100vh";
divRenderer.style.overflow = "hidden";

const smartConnect = SmartConnect.newInstance({ config: configuration });

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

  window.renderer = renderer;
  SizeHelper.onSizeChange(() => {
    renderer.resize();
  });
  SizeHelper.startListening();

  // Set live callbacks
  pvwClient.LiveVisualizationHandler.onConnected(() => {
    console.log("Catalyst connected");

    pvwClient.LiveVisualizationHandler.extract(configuration.sourceName).then(
      ({ id }) => {
        extracted = true;
      }
    );
  });

  pvwClient.LiveVisualizationHandler.onDisconnected(() => {
    console.log("Catalyst disconnected");
    clearIntervalCb();
  });

  let shown = false;
  let extracted = false;

  pvwClient.LiveVisualizationHandler.onUpdate(() => {
    if (extracted && !shown) {
      shown = true;
      pvwClient.LiveVisualizationHandler.show(configuration.sourceName).then(
        ({ id }) => {
          pvwClient.ViewPort.resetCamera();
          renderer.render();
        }
      );
    } else {
      renderer.render();
    }
  });

  renderer.onImageReady(() => {});

  const monitor = () => {
    return pvwClient.LiveVisualizationHandler.monitor().then(() => {
      monitor();
    });
  };

  pvwClient.LiveVisualizationHandler.connect(
    configuration.catalystURL,
    configuration.catalystPort
  ).then(() => {
    monitor();
  });
});

smartConnect.onConnectionClose(clearIntervalCb);
smartConnect.onConnectionError(clearIntervalCb);

smartConnect.connect();
