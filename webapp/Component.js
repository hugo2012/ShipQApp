sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/m/MessageBox",
	"com/bosch/sd/shipq/model/models",
	"sap/ui/model/json/JSONModel"
], 

	function (UIComponent, Device, models, MessageBox, JSONModel) {
	"use strict";

	return UIComponent.extend("com.bosch.sd.shipq.Component", {

		metadata: {
			manifest: "json",
			config: {
                fullWidth: true 
            }
		},
		
		/**
		 * Create content
		 * @returns {sap.ui.core.Control} the content
		 */
		createContent : function() {

			var oViewData = {
				component : this
			};
			return sap.ui.view({
				viewName : "com.bosch.sd.shipq.view.App",
				type : sap.ui.core.mvc.ViewType.XML,
				viewData : oViewData
			});
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// *** call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// *** set the device model
			// note from SAP: "The "device model" however is still a local model that has to be instantiated manually."
			var deviceModel = new sap.ui.model.json.JSONModel({
				isTouch : sap.ui.Device.support.touch,
				isNoTouch : !sap.ui.Device.support.touch,
				isDesktop : sap.ui.Device.system.desktop,
				isNoDesktop : !sap.ui.Device.system.desktop,
				isPhone : sap.ui.Device.system.phone,
				isNoPhone : !sap.ui.Device.system.phone,
				listMode : sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
				listItemType : sap.ui.Device.system.phone ? "Active" : "Inactive"
			});
			deviceModel.setDefaultBindingMode("OneWay");
			this.setModel( deviceModel, "device" );
			
			// *** set the window title from i18n; SAPUI5 does not do that for us
			var sBrowserTitle = this.getModel("i18n").getResourceBundle().getText( "browserTitle" );
			window.parent.document.title = sBrowserTitle;
			
			// *** routing; create the views based on the url/hash
			this._oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter(), this._bRouterCloseDialogs);
			this.getRouter().initialize();

		
			// *** create "filter" model for app wide filter information
			var oFilterModel = new JSONModel({
				PlantId: "",
				HandlingUnit: "",
				MaterialNumber: "",
				ShipToParty: "",
				DeliveryId: "",
				PackingInstruction: "",
				fileName: "",
				numberOfHits: 0,
				imgContext: "",
				Mime:"",
				Document:"",
				lastInputControlId:"",
				resetInputPage:"",
				InfoType: "None",
				InfoText: "",
				ShowAllDocs: false,
				UploadDate:new Date()
			});
			this.setModel( oFilterModel, "filters" );
			
			// *** create image root model
			// note: access to mimes does not work as relative path from launchpad; resource root
			//       differs from app (dxg) context to launchpad context; instead we need to
			//       get the resource root and use this as reference to mime objects
			var oRootPath = sap.ui.require.toUrl( "com/bosch/sd/shipq" );
			var oImageModel = new sap.ui.model.json.JSONModel({ path : oRootPath });
			this.setModel( oImageModel, "imageModel" );
		},
		
		/** ************************************************************
		 * helpers
		 * ************************************************************/
		  
		/** Shows a {@link sap.m.MessageBox} when a service call has failed.
	      * Only the first error message will be display.
	      * @param {string} sErrorTxt error text
	      * @param {string} sDetails a technical error to be displayed on request
	      */
		_showServiceError: function( sErrorTxt, sDetails ) {
			if( this._bMessageOpen)  {
				return;
			}
	        
	        //sDetails = sDetails === undefined ? this._getRessourceText( "errorModelNoDetails" ) : sDetails;
	        
	        this._bMessageOpen = true;
	        sap.m.MessageBox.error( sErrorTxt, { id: "serviceErrorMessageBox",
					            	             details: sDetails, 
					            				 actions: [sap.m.MessageBox.Action.CLOSE],
									             onClose: function() {
									                this._bMessageOpen = false;
										          }.bind(this)
	            							   } );
	    },
	    
		/** getRessourceText
		 *  @param {string} sKey key
		 *  @param {array} aParams string array for replacement
		 *  @return {string} a text from i18n. If not found in resource bundle then sKey value is being returned.
		 */
		_getRessourceText : function ( sKey, aParams ) {
			
	        var oBundle = this.getModel("i18n").getResourceBundle();
	        return oBundle ?  oBundle.getText( sKey, aParams ) : "";
		},

		/** ************************************************************
		  * App shutdown
		  * ************************************************************/
		exit : function() {
			this._oRouteMatchedHandler.destroy();
		},
		
		/** ************************************************************
		  * Close dialogs on navigation
		  *  app can decide if a navigation closes all open dialogs
		  * @param {boolean} bCloseDialogs true, closes all open dialogs
		  * ************************************************************/
		setRouterSetCloseDialogs : function( bCloseDialogs ) {
			this._bRouterCloseDialogs = bCloseDialogs;
			if (this._routeMatchedHandler) {
				this._routeMatchedHandler.setCloseDialogs(bCloseDialogs);
			}
		} 
	});
});