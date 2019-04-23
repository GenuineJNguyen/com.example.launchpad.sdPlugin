var websocket = null;
var pluginUUID = null;

var DestinationEnum = Object.freeze({"HARDWARE_AND_SOFTWARE":0, "HARDWARE_ONLY":1, "SOFTWARE_ONLY":2})

var timer;

var counterAction = {

    type : "com.example.launchpad.action",

    onKeyDown : function(context, settings, coordinates, userDesiredState) {

        var keyPressCounter = 0;
        if(settings != null && settings.hasOwnProperty('keyPressCounter')){
            keyPressCounter = settings["keyPressCounter"];
        }

        keyPressCounter++;
        //  airhorn.mp3
        var audio = new Audio('airhorn.mp3');
        audio.play();

        updatedSettings = {};
        updatedSettings["keyPressCounter"] = keyPressCounter;

        this.SetSettings(context, updatedSettings);

        this.SetTitle(context, keyPressCounter);

        timer = setTimeout(function () {
            var updatedSettings = {};
            // When key released goes back to (num +1)
            updatedSettings["keyPressCounter"] = 2;

            counterAction.SetSettings(context, updatedSettings);

            // How long you hold it for to reset (context, number, time to hold)
            counterAction.SetTitle(context, 100);
        },1500);
    },

    onKeyUp : function(context, settings, coordinates, userDesiredState) {
        clearTimeout(timer);
    },

    onWillAppear : function(context, settings, coordinates) {

        var keyPressCounter = 0;
        if(settings != null && settings.hasOwnProperty('keyPressCounter')){
            keyPressCounter = settings["keyPressCounter"];
        }

        this.SetTitle(context, keyPressCounter);
    },

    openUrl : function(context, webpage) {

        var json = {
            "event": "openUrl",
            "payload": {
                "url": webpage
            }
        };
        websocket.send(JSON.stringify(json));
    },

    SetTitle : function(context, keyPressCounter) {
        var json = {
            "event": "setTitle",
            "context": context,
            "payload": {
                "title": "" + keyPressCounter,
                "target": DestinationEnum.HARDWARE_AND_SOFTWARE
            }
        };

        websocket.send(JSON.stringify(json));
    },

    SetSettings : function(context, settings) {
        var json = {
            "event": "setSettings",
            "context": context,
            "payload": settings
        };

        websocket.send(JSON.stringify(json));
    }
};

function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo)
{
    pluginUUID = inPluginUUID

    // Open the web socket
    websocket = new WebSocket("ws://localhost:" + inPort);

    function registerPlugin(inPluginUUID)
    {
        var json = {
            "event": inRegisterEvent,
            "uuid": inPluginUUID
        };

        websocket.send(JSON.stringify(json));
    };

    websocket.onopen = function()
    {
        // WebSocket is connected, send message
        registerPlugin(pluginUUID);
    };

    websocket.onmessage = function (evt)
    {
        // Received message from Stream Deck
        var jsonObj = JSON.parse(evt.data);
        var event = jsonObj['event'];
        var action = jsonObj['action'];
        var context = jsonObj['context'];

        if(event == "keyDown")
        {
            var jsonPayload = jsonObj['payload'];
            var settings = jsonPayload['settings'];
            var coordinates = jsonPayload['coordinates'];
            var userDesiredState = jsonPayload['userDesiredState'];
            counterAction.onKeyDown(context, settings, coordinates, userDesiredState);
        }
        else if(event == "keyUp")
        {
            var jsonPayload = jsonObj['payload'];
            var settings = jsonPayload['settings'];
            var coordinates = jsonPayload['coordinates'];
            var userDesiredState = jsonPayload['userDesiredState'];
            counterAction.onKeyUp(context, settings, coordinates, userDesiredState);
        }
        else if(event == "willAppear")
        {
            var jsonPayload = jsonObj['payload'];
            var settings = jsonPayload['settings'];
            var coordinates = jsonPayload['coordinates'];
            counterAction.onWillAppear(context, settings, coordinates);
        }
    };

    websocket.onclose = function()
    {
        // Websocket is closed
    };
}