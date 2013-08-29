No More Global Modules
======================

Rationale
---------

Global modules are a bit of a pain. Yes, we need them for to run `coffee` and `jade` but this creates a problem.

By installing modules globally you can never really be certain whether a module you've `require()`d is included in your `package.json` depencencies. Also, installing module system-wide doesn't feel right.

No More Global Modules (or `nmgm`) alliviates these problems by installing "global" modules in `$HOME/bin`. Most distributions include `$HOME/bin` in `$PATH`.

Instead of `npm install -g coffee-script` you run `nmgm install coffee-script`. That's it.

Installation
------------

`nmgm` is not installed as a global module. There are two installation options:

* Either you `cd /tmp` and run `npm install nmgm`.

* Or you clone this repository and run `./install`. 

Next run `which nmgm` to make sure that `nmgm` is in the path. You may need to add `$HOME/bin` to `$PATH` on your machine.

