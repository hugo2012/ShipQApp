/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comboschrb1msddata2mail/sdd_data2mail/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
