// Yes, I realize this script's name is kinda funny. I got nothing better to call it.

let Nodes = new function() {

    const BUFFER_INTERVAL = 1024;

    let initialized = false;

    let context;
    let mediaSource;
    let analyzer;
    let scriptProcessor;

    this.setUp = function() {
        if (initialized) {
            throw "Already initialized (call destroyContext() first)";
        }

        context = new AudioContext();

        if (mediaSource == undefined) {
            mediaSource = context.createMediaElementSource(document.querySelector("audio"));
        }
        mediaSource.connect(context.destination);

        scriptProcessor = context.createScriptProcessor(BUFFER_INTERVAL, 1, 1);
        scriptProcessor.onaudioprocess = handleAudio;
        scriptProcessor.connect(context.destination);

        analyzer = context.createAnalyser();
        analyzer.connect(scriptProcessor);
        analyzer.smoothingTimeConstant = Config.temporalSmoothing;
        analyzer.minDecibels = Config.minDecibels;
        analyzer.maxDecibels = Config.maxDecibels;

        try {
            analyzer.fftSize = Config.fftSize; // ideal bin count
            console.log("Using fftSize of " + analyzer.fftSize + " (woot!)");
        } catch (ex) {
            analyzer.fftSize = 2048; // this will work for most if not all systems
            console.log("Using fftSize of " + analyzer.fftSize);
            alert("Failed to set optimal fftSize! This may look a bit weird...");
        }

        mediaSource.connect(analyzer);

        initialized = true;
    }

    this.playSong = function(song, url) {
        $("#audio").attr("src", song != null ? "./songs/" + song.getFileId() : url);
    }

    let handleAudio = function() {
        let array =  new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(array);

        let spectrum = Transform.transform(array);
        let multiplier = Transform.multiplier(spectrum);
        Callbacks.invokeCallbacks(spectrum, multiplier);
    }

    this.playSongFromUrl = function(url) {
        this.playSong(null, url);
    }

    this.playRandomSong = function() {
        Nodes.playSong(SongLoader.randomSong());
    }

}
