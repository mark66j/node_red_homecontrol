node_red_homecontrol
====================

Early attempt at building home automation on Node-RED and Insteon

This project uses the Insteon interfaces from this project:

[home-controller](https://github.com/automategreen/home-controller)

At the moment the main control nodes only support simple On and Off operations on Insteon devices. Support for creating Scenes is very experimental and does not work so far.

I am planning to create a node that accepts a msg containing a JSON object specifying more complex controls, such as dimming.

These nodes only support the Insteon Power Line Modem (PLM) on a serial or usb-serial port. The port for the PLM can be specified in each node; a configuration node remembers the previous settings. The underlying libraries support older versions of Insteon Hub, but this code does not.

This has so far been tested only on a Raspberri Pi running Raspbian. It should work on Linux or OSX, but may not work with Windows serial ports.

As of now there is no support for X10 devices controlled via the PLM, as I haven't found any libraries in Node to do that. I have some X10 devices but may end up just replacing them. X10 control using a separate modem and Linux command line tools, and the exec node.




