function initMIDI(d) {

    const errMsg = d.getElementById('error-msg');
    const onMIDIMessage = (msg) => console.log(msg.data);

    if (!navigator.requestMIDIAccess) {
        errMsg.innerHTML = 'no midi available';
        return;
    }

    navigator.requestMIDIAccess({

        sysex: false

    }).then(

        function midiSuccess(MIDIAccess) {

            for (let input of MIDIAccess.inputs.values()) {
                input.addEventListener('midimessage', onMIDIMessage); 
            }
            
        },
        function midiFail() {
        }

    );

}

initMIDI(document);
