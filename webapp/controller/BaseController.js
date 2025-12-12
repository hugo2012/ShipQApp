sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/routing/History",
		"sap/ui/model/Filter",
		"sap/m/MessageBox",
        "com/bosch/sd/shipq/service/Service",
	],

	function (Controller, History, Filter, MessageBox,Service) {
		"use strict";
        let _oService = Service; // Service is shared between all controllers
		var BaseController = Controller.extend("com.bosch.sd.shipq.controller.BaseController", {
            onInit:  function () {
			 _oService.init(this);
            },
            getService: function () {
                //debugger;
                return _oService;
            },
             /*
			Set root view busy
            */
            
            setBusy: function (bBusy) {
                this.getView().setBusy(bBusy);
            },
			// ***
			// generic helpers
			// ***

			/* getRouter
			 *  convenience function to get my router
			 */
			getRouter: function () {
				return sap.ui.core.UIComponent.getRouterFor(this);
			},

			/* onNavTo
			 *  navigates to a routing target; target must be defined at element as custom property
			 *  e.g.: custom:to="tileNavigator"; needs namespace: xmlns:custom="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			 */
			onNavTo: function (oEvent) {
				var sTarget = oEvent.getSource().getCustomData()[0].getValue();
				this.getRouter().navTo(sTarget);
			},

			/* getRessourceText
			 *  returns a text from i18n. If not found in resource bundle then sKey value is being returned.
			 */
			getRessourceText: function (sKey, aParams) {
				var rRet = sKey;
				var oBundle = this.getView().getModel("i18n").getResourceBundle();
				if (oBundle) {
					rRet = oBundle.getText(sKey, aParams);
				}
				return rRet;
			},

			/** 
			 *  reads a property from technical properties
			 *  @param {string} sKey - property key
			 *  @param {string[]} aParams - array of parameters to be exchanged in the keys value
			 *  @returns {string} a value from technical.properties. If not found in bundle then sKey value is being returned.
			 */
			getTechnicalProperty: function (sKey, aParams) {

				var ret = sKey;
				var oBundle = this.getView().getModel("tprops").getResourceBundle();
				if (oBundle) {
					ret = oBundle.getText(sKey, aParams);
				}
				return ret;
			},

			/* no legal plant: show error dialog
			 */
			showErrorDialog: function (sError) {
				var sTitle = this.getRessourceText("errorMsgTitle");
				sap.m.MessageBox.error(sError, {
					title: sTitle
				});
			},

			// ***
			// generic handlers
			// ***

			/* onNavBack
			 *  Generic back navigation using history
			 */
			onNavBack: function (oEvent) {
				var text = this.getView().byId("docTitle");
				text.setVisible(false);
				text.removeStyleClass("yellowTxtHlight");
				var oHistory = History.getInstance();
				// returns only if a navigation inside the app already happened (not coming from an external site)
				var sPreviousHash = oHistory.getPreviousHash();

				// if navigation happened, return to previous sider. Otherwise got to overwiev and update browser history ('true')
				if (sPreviousHash !== undefined) {
					window.history.go(-1);
				} else {
					this.getRouter().navTo("scanInput", {}, true /*no history*/ );
				}
			}
		});

		return BaseController;
	});