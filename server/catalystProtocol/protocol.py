from paraview import simple, live
from paraview.web import protocols as pv_protocols
from wslink import register as exportRpc


class ParaViewWebLiveVizHandler(pv_protocols.ParaViewWebProtocol):
    def __init__(self, **kwargs):
        super(ParaViewWebLiveVizHandler, self).__init__()
        self.dataExtracted = False
        self.processEvents = False
        self.sourceName = None
        self.liveVisualizationSession = None
        self.source = None
        self.rep = None

    def connectionCreatedCb(self, obj, event):
        self.publish('catalyst.live.connected', None)

    def connectionClosedCb(self, obj, event):
        self.processEvents = False
        self.publish('catalyst.live.disconnected', None)

    def updateEventCb(self, obj, event):
        self.publish('catalyst.live.updated', None)

    @exportRpc('catalyst.live.extract')
    def extract(self, name='input'):
        sourceProxy = live.ExtractCatalystData(self.liveInsituLink, name)
        return {
            'id': sourceProxy.SMProxy.GetGlobalIDAsString()
        } if sourceProxy else {}

    @exportRpc('catalyst.live.show')
    def show(self, name='input'):
        print("show")
        source = simple.FindSource(name)
        if source:
            rep = simple.Show(source)
            return {
                'id': rep.SMProxy.GetGlobalIDAsString()
            } if rep else {}
        return {}

    @exportRpc('catalyst.live.monitor')
    def monitor(self):
        if self.processEvents:
            live.ProcessServerNotifications()

    @exportRpc('catalyst.live.connect')
    def connect(self, host='localhost', port=22222):
        self.liveInsituLink = live.ConnectToCatalyst(
            ds_host=host, ds_port=port)

        self.processEvents = True

        connectionCreatedCallback = lambda *args, **kwargs: self.connectionCreatedCb(
            *args, **kwargs)
        connectionClosedCallback = lambda *args, **kwargs: self.connectionClosedCb(
            *args, **kwargs)
        updateEventCallback = lambda *args, **kwargs: self.updateEventCb(
            *args, **kwargs)
        self.liveInsituLink.AddObserver(
            "ConnectionCreatedEvent", connectionCreatedCallback)
        self.liveInsituLink.AddObserver(
            "ConnectionClosedEvent", connectionClosedCallback)
        self.liveInsituLink.AddObserver("UpdateEvent", updateEventCallback)

    @exportRpc('catalyst.live.pause')
    def pause(self, pause=True):
        live.PauseCatalyst(self.liveInsituLink, pause)

    @exportRpc('catalyst.live.disconnect')
    def disconnect(self, event):
        pass  # TODO
