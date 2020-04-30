from paraview import simple
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

    def _getSourceToExtractName(self, liveInsituLink):
        pm = liveInsituLink.GetInsituProxyManager()
        name = 'input'
        proxy = pm.GetProxy('sources', name)
        if proxy == None:
            # if no one exists, pick another one
            name = pm.GetProxyName(
                'sources', pm.GetNumberOfProxies('sources') - 1)
        return name

    def connectionCreatedCb(self, obj, event):
        name = self._getSourceToExtractName(obj)
        self.sourceName = name
        self.liveVisualizationSession = obj
        simple.ExtractCatalystData(self.liveVisualizationSession, name)
        simple.ProcessServerNotifications()
        self.publish('catalyst.live.connected', {"source": name})

    def connectionClosedCb(self, obj, event):
        self.processEvents = False
        self.publish('catalyst.live.disconnected', None)

    def updateEventCb(self, obj, event):
        name = self._getSourceToExtractName(obj)
        if not self.source:
            self.source = simple.FindSource(name)
        simple.SetActiveSource(self.source)
        if self.source and not self.rep:
            self.outline = simple.Outline(self.source)
            self.rep = simple.Show(self.source)
            self.outline.UpdatePipeline()
            self.outlineRep = simple.Show(self.outline)
            # TODO: this is for the demo
            # TODO: what would be the best way to change sources and representations from the client ?
            # create a protocol for liveInsituLink.GetInsituProxyManager() ?
            # or setActiveSource endpoint ?
            # or is there a better way ?
            info = self.source.GetPointDataInformation()
            if info.GetNumberOfArrays() > 0:
                arrName = info.GetArray(0).Name
                self.rep.ColorArrayName = ['POINTS', arrName]
                simple.ColorBy(self.rep, arrName)
            # Point gaussian
            props = simple.GetDisplayProperties(self.source)
            props.SetRepresentationType('Point Gaussian')
            props.GaussianRadius = 0.01

    @exportRpc('catalyst.live.monitor')
    def monitor(self):
        if self.processEvents:
            simple.ProcessServerNotifications()

    @exportRpc('catalyst.live.connect')
    def connect(self, host='localhost', port=22222):
        self.liveInsituLink = simple.ConnectToCatalyst(ds_host=host, ds_port=port)

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

        self.processEvents = True

    @exportRpc('catalyst.live.disconnect')
    def disconnect(self, event):
        pass  # TODO
