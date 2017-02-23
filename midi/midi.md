# MIDI for Everyone

"I'm controlling,
and composing" - Kraftwerk, *Pocket Calculator*

## PART I: What is MIDI?

MIDI is short for Musical Instrument Digital Interface, a communication protocol as well as a hardware / software spec  that enables communication between MIDI-enabled digital instruments. With MIDI you can establish a network of instruments that are synced in tempo and that are able to communicate with and control each other in user-programmed ways.

The data protocol aspect of MIDI provides a standardized message format that can be received and interpreted by any MIDI-enabled instrument.  For example, by pressing down on a MIDI keyboard's key, one could send a 'note-on' signal along with information about the key pressed, like the key number and velocity of the key press, to its target device (e.g., a computer running Logic), where the sound is produced using these parameters.

The hardware specification aspect  provides a common physical format for MIDI components and includes MIDI cabling, physical ports and internal mechanisms that receive and send voltage and convert it to data in the digital domain). [This part needs work.]

Here's what the back of a MIDI-capable MPC1000 sampler looks like:

[Image of MIDI device]()

## MIDI instruments

Common MIDI-enabled devices include keyboards, pianos, guitars and even wind instruments. Since MIDI itself is a protocol and an interface to convert voltage to note data in the digital domain, the possibilities are quite vast. Additionally, today, USB MIDI controllers are very common due to their low cost and portability. A MIDI controller doesn't produce any sound itself but sends MIDI data to external sound generators, where the sound can be rendered according to the control data contained in the MIDI messages. MIDI controllers commonly come in the form of a keyboard or a grid of pads and knobs akin to what you would find on a sampler. 

## MIDI in Action

MIDI can communicate a variety of parameters such as pitch, velocity, volume and envelope information. It also communicates clock source information. In the video below, I demonstrate the effect of configuring the clock source on a digital sampler as the tempo source and then set the clock-source on a digital keyboard to receive this master tempo and sync with it. Watch at the end as I drop the tempo on the sampler: the tempo on the keyboard drops as well.

[Video]()

## History 

Initially, MIDI provided a standard way for musicians and composers to connect keyboard-based instruments made by different manufacturers without needing extra proprietary hardware and software.  The MIDI language encodes formal parameters over time that make it possible to recreate a sound in a connected MIDI-capable sound generation device. The draw is increased intercompatibility as well as efficiency: since it doesn't generate sound itself, but merely the formal parameters used to generate a sound, MIDI data requires about 1/100 of the information required to represent a sound as an actual sound file. And since the parameters used in constructing the sound are separate from the sound itself, a MIDI-encoded performance is essentially separate from and the generated sound, and thus experimentation with or temporal modification of the sound can be done after the fact.

Today, the benefits are even greater. You can do your composing on an airplane with just a small MIDI controller and a laptop. You could play a MIDI saxophone. Or, with the drop in the cost of microcontrollers, you could capture physical phenomena like weather data read from physical sensors and convert it into MIDI data to generate music via the weather.

## MIDI Messages

A MIDI device can control its target device by sending MIDI messages across a MIDI cable connecting its OUT port to the target device's IN port. MIDI messages are transmitted serially as an asynchronous stream of 10-bit words, where the first and last bits are markers to keep the data in time sync and the middle 8 bytes are the MIDI messages, either status or data information.  In the stream, a status byte is usually followed by 1 or 2 data bytes.

[ diagram ]

In order to interpret the MIDI messages, it's important to understand the binary and hexidecimal number systems. I'm going to briefly explain how those work as a review but since we'll be putting this to direct use in Part II, if you're not comfortable with converting from binary to hexidecimal and vice versa, you might find [this article]() useful.

### Binary and Hexidecimal Numbers

#### Binary
#### Hexidecimal

#### MSB, LSB

### Interpreting Status and Data Bytes

A MIDI message, as mentioned previously, is a 10-bit word, where the first and last bits are framing bits providing synchronization information over an asynchronous transmission.  Concentrating on the middle 8 bits, we can tell whether a packet is a status byte or a data byte by whether its MSB (most significant bit) is a 1 or a 0.  Status bytes have a 1 as their MSB, while data bytes have a 0. The remaining 7 bits, which allow values in the range 0 - 127, account for the containing data.

Before we dive into deciphering the status and data bytes' content, here is the MIDI data corresponding to a middle C played at full velocity:


    1001_1111 --> status byte for MIDI channel 16
        0011_1100 --> data byte, key 60
            0111_1111 --> data byte, velocity is 127
                
                    

                    ## PART II: The Web Midi API



### The Interface
The Web MIDI API provides low-level access to connected MIDI devices, which provides the raw MIDI information and not what that could mean in musical terms.

To access the Web MIDI API, we need to access the `requestMIDIAccess` method on the global `navigator` object. This returns a `Promise`.  Because requesting MIDI access from the browser presents security implications, the user needs to enable web midi via a browser-prompt, although this can vary depending on the host of the browser/user agent.

### Detecting MIDI Inputs and Outputs
### Getting Information About your Midi Device
### Midi 

#### Sources:
http://www.nyu.edu/classes/bello/FMT_files/8_MIDIcomms.pdf
http://www.harfesoft.de/aixphysik/sound/midi/pages/whatmidi.html
http://www.electronics.dit.ie/staff/tscarff/Music_technology/midi/midi_messages.htm
