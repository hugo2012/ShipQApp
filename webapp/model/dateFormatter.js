sap.ui.define([], function () {
	"use strict";
	var vFlag = false;
	return {

		// *** Text for Standard / Local ltrans
		dateText: function (oDate) {
			if (oDate) {
				//var sReturn;
				oDate = new Date(oDate)
				var sDate = "";
				var year = oDate.getFullYear();
				var month = oDate.getMonth();
				var date = oDate.getDate();
				var year1 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).getFullYear();
				var month1 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).getMonth();
				var date1 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).getDate();
				var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance();
				//return sReturn;
				sDate = oDateFormat.format(oDate);
				var dateCompare = new Date(year, month, date) > new Date(year1, month1, date1);
				if (dateCompare === true) {
					vFlag = true;
				} else {
					vFlag = false;
				}
			}
			return sDate;
		},
		boolean: function () {
			return vFlag;
		}
	};
});