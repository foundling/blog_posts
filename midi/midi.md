# MIDI for Programmers

"I'm controlling,
and composing" - Kraftwerk, *Pocket Calculator*

In this article, I'm going to ground some JavaScript experiments with the recently available WebMIDI API within the history and design concerns of MIDI technology. MIDI was formalized in 1983 and since its inception it has become a predominant tool in not only music performance and composition but also non-musical areas such as visual and light orchestration. Google Chrome's implementation of MIDI has been around for a couple years now and offers a fairly simple gateway into controlling audio and visuals in your browser via MIDI messages.

To dispel any confusion up front, MIDI is not:

 - Those cheesy sounds that you hear on that geocities page that was last updated in August of 1994. That type of 'MIDI' has much more to do with the tension between mass production and the death of quality (well, more specifically, the MIDI extension called General MIDI).
 - Digital Audio.  MIDI doesn't transmit sound itself, just the parameters that can be used to create sound.


## MIDI is About Control

At its purest, MIDI is a protocol and hardware/software specification designed to enable communication between MIDI-enabled devices.  With MIDI you can establish a network of instruments that are synced in tempo and that are able to control and be controlled by each other in user-programmed ways.  If this idea seems somewhat hard to pin down, that's because the possibilities for application and the shear number of network configurations are quite vast. And it doesn't restrict you to controlling sound.  Extensions to the MIDI spec have provided for alternate uses such as light automation for live entertainment.

### A Protocol

MIDI is a protocol that provides a standardized message format that can be received and interpreted by any MIDI-enabled instrument.  For example, by pressing down on a MIDI keyboard's key, one might send a 'note-on' signal along with information about the event, like the key number and velocity of the key press, to a target device (e.g., a computer running Logic or ProTools) where those sound parameters are used in the actual production of sound.

### A Hardware Spec

The hardware specification aspect  provides a common physical format for MIDI components and includes MIDI cabling, physical ports and internal mechanisms that receive and send voltage and convert it to data in the digital domain). [This part needs work.]

Here's what the back of a MIDI-capable MPC1000 sampler looks like:

![An MPC1000 is a MIDI-capable device](http://www.midifan.com/image/nnews/2003/MPC1000-rear-lg.jpg)

It has two MIDI OUT ports that can be used to transmit MIDI data to other systems.  It also has two MIDI IN ports on which it can receive MIDI data from two separate MIDI systems.

## MIDI Instruments

Common MIDI-enabled devices include keyboards, samplers, pianos, guitars and even wind instruments. Since MIDI itself is a protocol and an interface to convert voltage to note data in the digital domain, the possibilities are quite vast. Additionally, today, USB MIDI controllers are very common due to their low cost and portability. A MIDI controller doesn't produce any sound itself but sends MIDI data to external sound generators, where the sound can be rendered according to the control data contained in the MIDI messages. MIDI controllers commonly come in the form of a keyboard or a grid of pads and knobs akin to what you would find on a sampler. 

## A Demonstration

MIDI can communicate a variety of parameters such as pitch, velocity, volume and envelope information. It also communicates clock source information. In the video below, I demonstrate the effect of configuring the clock source on a digital sampler as the master tempo source and then set the clock-source on a digital keyboard to receive this master tempo and sync with it. Watch at the end as I drop the tempo on the sampler: the tempo on the keyboard drops as well.

[Me Demonstrating MIDI]()

## Historical Motivations for MIDI

### Polyphony

People have been using intermediary technology to control the performance of music long before MIDI was conceived.  The immediate predecessor of MIDI was a mechanism known as CV/Gate which transmits voltage as pitch and note duration as a gate or 'trigger' which communicates an on or off state.  While the CV gate model worked well enough for monophonic synthesizers that produced a single note at a time, in the late 70s and early 80s, musicians and composers started to gravitate toward polyphonic instruments that could produce multiple, simultaneous notes or signals.  The motivation for MIDI was partly the fact that the mechanisms for controlling and modulating actual current along its path from the sound generator to the output doesn't scale for polyphonic instruments.  Monophonic synthesizers alone already take enough space, no?

![A rack of monosynth modules](http://dt7v1i9vyp3mf.cloudfront.net/styles/news_large/s3/imagelibrary/b/buchlacbuchla200evergreen.jpg?K6oDDEWlAdE8tAu2Q1Expkphg5nmWZPx=&itok=vAwshZDJ)

Let's think roughly about the requirements for polyphonic notes controlled via CV/Gate. If `n` is the number of notes in a polyphonic device and `h` is the hardware/space requirements for the transmission of one note's signal via CV/Gate to an external sound module, then your hardware requirements are at least `h x n` if you want to control multiple simultaneous notes on an external system. That turned out to be quite impractical, since the increase in components meant higher complexity, higher production cost, greater failure rate, and greater space requirements.

MIDI was a light-weight way to work around this limitation. Instead of control voltages,  it transmitted 16 separate channels of data across a single cable from one MIDI device to another. And that information could represent polyphonic notes.  While the note data transmitted isn't truly simultaneous, the 31250 bps baud rate (bits per second) was fast enough for most applications that the effect on the human ear resulted in simultaneity.

### Compatibility

Another motivation, one that the preeminent synth designers of the day (Dave Smith of Sequential Circuits, Ikutaru Kakehashi of Roland, and others ... the historical details are anything but static, even to Dave Smith) had specifically in mind, was to provide a standard way for musicians and composers to connect synthesizers made by different manufacturers without needing extra proprietary hardware and software.

### Efficiency

The MIDI language encodes formal parameters over time that make it possible to recreate a sound in a connected MIDI-capable sound generation device. The draw is compatibility as well as efficiency: since it doesn't generate sound itself, but merely the language used to generate a sound, MIDI data requires about 1/100 of the information required to represent a sound as an actual sound file.  And since the parameters used in constructing the sound are separate from the sound itself, a MIDI-encoded performance is essentially separate from and the generated sound, and thus experimentation with the sound and temporal modification of the event sequence can be done after the fact.

Today, the benefits are even greater. You can do your composing on an airplane with just a small MIDI controller and a laptop. You could play a MIDI saxophone. Or, with the drop in the cost of micro-controllers, you could read data from the physical world, transform it into MIDI data, and render that via an instrument.

## MIDI Messages

### An asynchronous transmission

A MIDI device can control its target device by sending MIDI messages across a MIDI cable connecting its OUT port to the target device's IN port. MIDI messages are transmitted asynchronously (as discrete events) and serially in packets of 10-bit groups (called *words*) at a maximum rate of 3125 bits per second (the baud rate).  This baud rate is fairly low, even by the standards of 1983, but the proponents of the MIDI spec considered it essential for MIDI's success in the midst of a growing market of mass-produced digital instruments. The transmission rate is low enough to be remain relatively uncomplicated from an engineering perspective, but fast enough in *most* circumstances to remain reliable and convincing to the human ear.

### Succinct Messages

Once consequence of this relatively low baud rate is that MIDI messages are quite succinct, containing multiple pieces of information within a single byte.  

The MIDI message byte when transmitted along the cable is technically 10-bits long, but the first and last bit indicate the boundaries of the MIDI message. This is so that during asynchronous transmission of MIDI data, the packets boundaries are interpreted correctly on the receiving end and thus are decoded into their intended MIDI messages.  Because the start and stop bits are only used in ensuring accurate transmission of data (indicating when the MIDI event starts and when it stops), they are stripped from the MIDI byte long before we receive it through the WebMIDI API. 

The middle 8 bits are the actual MIDI message of significance to a JavaScript programmer. This resulting byte can be either a status byte or a data byte.  A MIDI stream consists of status bytes that are usually followed by 1 or 2 data bytes.

Status Byte Table

Data Byte Table

I mentioned that MIDI messages are quite succinct.  Because of this, I'm going to review the binary number system and discuss ways to work with bytes so that we have the necessary skills to extract the information from these status and data bytes.

### Binary Notation Primer

The binary number system is a positional number system that represents values as a a sequences digits comprised of `1`s and `0`s. The positional part means that the value that a digit represents is dependent upon its position in the sequence. Using only two values at the lowest level in a computer system that transforms voltage into digital information is beneficial because of its simplicity.  A value is either 1 or 0, which communicates either presence or absence.    If we can control the transmission of voltage in a manner where only two states exist and can be clearly distinguished from one another, then that voltage can be mapped directly to a 1 or a 0. And by combining sequences of `1`s and `0`s, we can build more sophisticated representations.

### Values are compositions of positional representations

The decimal value `123` is a composition of `100`, `20`, and `3`. Thinking about values as compositions of other values will be useful when working with less familiar number systems like binary or hexadecimal.

Generally speaking, we can scan the number from right to left, going from the power of 0 upward by 1 each time, and each time ask, do I include this number in the total sum of numbers? If the digit is a `0`, the answer is no. Otherwise, the answer is yes, and we have to do some simple multiplication to calculate what that `1` represents given the context of its position within the string of bits.

#### A Decimal Example

Let's work with a few examples. The general procedure is this:  We will be looking at each number in order from right to left.  At each place, we consider its place value to be the radix, or base, (`2`, `10`, `16`, etc) to a power that increases by one in each position leftward. The powers will always start at `0`.

Let's start with a decimal number to illustrate that the form of reasoning is identical across bases. 

#### Example 1

Here's our decimal number: `123`. 

The `3` in `123` means that this number is composed of (or includes) the value that is the base `10` to some power that is one greater than the power to the right (if it exists), and that resulting value is finally multiplied by `3`.  Since this is the first number on the right, the power is `0`.  We end up with 3 because `(10^0) x 3` is 3.  

The `2` in `123` means that `123` is composed of `10` to next power (which is `1`), times 2. This gives us `(10^1) x 2`, or 20.

And the `1` in `123` means that `123` is composed of the value `10` to the next power (which is `2`), times `1`. So we have `(10^2) x 1`, or 100.  

We can take each value of which `123` is composed and add them up:  `3 + 20 + 100` equals `123`, our original number.

### Binary Examples

#### Example 1: binary to decimal

Here is our binary number: `1010`.

This can be interpreted in the same form as the decimal above, except that instead of exponentiating `10` by some increasing power, we exponentiate `2` by some increasing power.  

Let's apply our general formula

`(base^increasing power) x current digit`

using `2` for base.

`(2^0) x 0` equals `0`.
`(2^1) x 1` equals `2`.
`(2^2) x 0` equals `0`.
`(2^3) x 1` equals `8`.

Summing the composite values `0`,`2`,`0` and `8` , we get `10`.

#### Example 3: decimal to binary

Let's take the decimal value `123` and write it in binary.  This requires us to work in the opposite direction, figuring out which powers of two compose the number, `123`. 

The first step here is to figure out how many places we'll need to hold this number in binary.  since `2^7` is `128`, we won't need more than `7` binary places to store this value.

Here's our placeholder binary sequence: 

`[ ] [ ] [ ] [ ] [ ] [ ] [ ]`. 

When figuring out binary representations from decimal representations, we want to do the following:

 - Find the highest power of two that fits into the decimal value `123`, our current value
 - Place a `1` in the correct location in our placeholder string so that the presence of this power of two is represented.  
 - Subtract that power of two from our sum and repeat 
 - If our new decimal value is `0`, we are finished.
 - Any value in the placeholder string that is not a `1` is a `0`.
 
The highest power of `2` that is equal to or less than `123` is `6`, so we can put a `1` in the place where the power of `6` digit goes. This indicates that the total value is partially composed of `2^6`.

We then subtract `64` from `123` to get our new value under consideration: `59`.

Our placeholder sequence is now: 

`[1] [] [ ] [ ] [ ] [ ] [ ]` 

and our new decimal number is not `0`, so we repeat the process.

The largest power of `2` that is less than or equal to `59` is `32`, which is `2^5`.  So in the binary place where the power is `5`, we place a `1`.

Our placeholder sequence: `[1] [1] [ ] [ ] [ ] [ ] [ ]`.
Our new value to consider is `59 - 32`, or `27`.

The highest power of `2` that is less than or equal to `27` is `16`, which is `2^4`.  This means a `1` goes in the slot for the power of `4`.

Our placeholder sequence: `[1] [1] [1] [ ] [ ] [ ] [ ]`.
Our new value to consider is `11`.

The highest power of `2` that fits into `11` is `3`, which is `2^3`, or `8`.  So we place a `1` in the `3` power slot in our sequence.

Our placeholder sequence:  `[1] [1] [1] [1] [ ] [ ] [ ]`.
Our new value to consider is `11 - 8`, or `3`.

The highest power of `2` that fits into `3` is `1`, which is `2^1`, or `2`.  So we place a `1` in the `1` power slot in our sequence.

Our placeholder sequence:  `[1] [1] [1] [1] [ ] [1] [ ]`.
Our new value to consider is `3 - 2`, or `1`.

The highest power of `2` that fits into `1` is `0`, because anything to the `0th` power is `1`.  So we place a `1` in the `0` power slot in our sequence, which is all the way to the right.

Our placeholder sequence:  `[1] [1] [1] [1] [0] [1] [1]`.
Our new value to consider is `0`, so we are finished.

Anything that isn't a `1` in binary is necessarily a `0`, so our final binary representation of the decimal number `123` is `1111011`.


### Interpreting Status and Data Bytes

A MIDI message, as mentioned previously, is a 10-bit word, where the first and last bits are framing bits providing synchronization information over an asynchronous transmission.  Concentrating on the middle 8 bits, we can tell whether a packet is a status byte or a data byte by whether its MSB (most significant bit) is a 1 or a 0.  Status bytes have a 1 as their MSB, while data bytes have a 0. The remaining 7 bits, which allow values in the range 0 - 127, account for the containing data.

Before we dive into deciphering the status and data bytes' content, here is the MIDI data corresponding to a middle C played at full velocity:


    byte 1: 1001_1111 --> status byte for MIDI channel 16
    byte 2: 0011_1100 --> data byte, key 60
    byte 3: 0111_1111 --> data byte, velocity is 127


## PART II: The Web Midi API


Now that we've gone probably further than we needed to into the details of MIDI itself, we are informed enough to start using the Web MIDI API in the browser.

### The Interface

The Web MIDI API provides low-level access to connected MIDI devices.  In a nutshell:

 -  We can connect a device to our computer via USB or a MIDI interface and detect it from within the JavaScript runtime environment in our web browser.
 - We can listen for MIDI events on a detected device
 - We can get the byte-level data from those events

To access the Web MIDI API, we need to access the `requestMIDIAccess` method on the global `navigator` object. This returns a `Promise`.  Because requesting MIDI access from the browser presents security implications, the user needs to enable web midi via a browser-prompt, although this can vary depending on the host of the browser/user agent.

### Detecting MIDI Inputs and Outputs
### Getting Information About your Midi Device
### Midi 

#### Sources:
http://www.nyu.edu/classes/bello/FMT_files/8_MIDIcomms.pdf
http://www.harfesoft.de/aixphysik/sound/midi/pages/whatmidi.html
http://www.electronics.dit.ie/staff/tscarff/Music_technology/midi/midi_messages.htm
http://digitalsoundandmusic.com/chapters/ch6/
