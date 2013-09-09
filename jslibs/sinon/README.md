# Port of [Sinon.JS](http://sinonjs.org/) to [Vert.x] (http://vertx.io/)

This is a port of Sinon.JS 1.7.3 for the Vert.x 2 environment. 

## Modified files

The original files are kept in this repository for easy comparison with the modified ones.
They can be identified by an appended "_ORIG" before the filename extension.

## Additional files

One file was added:

* sinon/lib/sinonloader.js: Vert.x loader for Sinon.JS, avoiding circular module
dependencies which proved problematic in this environment. 

## Removed files

No files were removed.