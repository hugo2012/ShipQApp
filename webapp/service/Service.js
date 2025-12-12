sap.ui.define([
], function () {
	"use strict";
	var _oController = null;
	var _oService = null;
	_oService = {
		init: function (oBaseController) {
			_oController = oBaseController;
		},	
		getShipping_DocumentSet :function(aFilter)
		{
			return new Promise((resolve, reject) => {
				let oModel = _oController.getOwnerComponent().getModel("mainService");
				// var _oData = {
				// 	oData: [],
				// 	oCount:0
				// };
				//ListBinding
				var oListBinding = oModel.bindList(
					"/xRB1MxSD_C_Shipping_Document",             //sPath
					null,                                       //oContext
					null,                                       //vSorters - Dynamic Sorters 
					aFilter                                    //vFilters - Dynamic Filters 
					// {                                         //mParametes                   
					// 	"$expand": "navigationProperty",
					// 	"$select": "property1,property2"
					// }
					// {
					// 	"$count": true
					// }
				);
				//Fetching a List of Entities:
				oListBinding.requestContexts().then((oListContext) => {
					let oData = oListContext.map(rowContext => rowContext.getObject());	
					//Handle success
					resolve(oData);
					//_oData.oData = oData;
					//debugger;
				})
				.catch((oError) => {
					//Handle error
					reject(oError);
					debugger;
				});
			/*    oListBinding. getHeaderContext().requestProperty("$count").then((oCount) =>{
					let _oCount = oCount;
					_oData.oCount = _oCount;
					resolve(_oData);
				}) */		
			});
		},
		getDocument_ContentSet :function(aFilter)
		{
			return new Promise((resolve, reject) => {
				let oModel = _oController.getOwnerComponent().getModel("mainService");
				// var _oData = {
				// 	oData: [],
				// 	oCount:0
				// };
				//ListBinding
				var oListBinding = oModel.bindList(
					"/xRB1MxSD_C_Document_Content",             //sPath
					null,                                       //oContext
					null,                                       //vSorters - Dynamic Sorters 
					aFilter                                    //vFilters - Dynamic Filters 
					 //{                                         //mParameters                   
					// 	"$expand": "navigationProperty",
					// 	"$select": "property1,property2"
					// }
					// {
					// 	"$count": true
					// }
				);
				//Fetching a List of Entities:
				oListBinding.requestContexts().then((oListContext) => {
					let oData = oListContext.map(rowContext => rowContext.getObject());	
					//Handle success
					//_oData.oData = oData;
					resolve(oData);
				})
				.catch((oError) => {
					//Handle error
					reject(oError);
					debugger;
				});
				/*  oListBinding. getHeaderContext().requestProperty("$count").then((oCount) =>{
					let _oCount = oCount;
					_oData.oCount = _oCount;
					resolve(_oData);
				}) 	 */
			});
		},
			
		oDataCreate: function (oModel, sPath, oDeepEntityData) {
			//oModel.create(sPath, oData, oSettings);
			//var oModel = this.getView().getModel(); // Assuming your OData V4 model is named 'oModel'
			var oListBinding = oModel.bindList(sPath); // Binding to the parent entity set

			var oContext = oListBinding.create(oDeepEntityData, {
				// Optional: specify a groupId for batch processing
				// groupId: "myChangeSet"
			});
		   oContext.created().then(function() {
				// Success: Entity created successfully in the backend
				//sap.m.MessageToast.show("Deep entity created successfully!");
				 let oData = oContext.getObject();	
				 resolve(oData);
			}).catch(function(oError) {
				// Error: Handle creation failure
				//sap.m.MessageBox.error("Error creating deep entity: " + oError.message);
				 reject(oError);
			});
		},
		showLocalErrorMessage: function (oError, fnError) {

			this.showMessageBox( fnError);
		},
		showMessageBox: function ( fnError) {
			sap.m.MessageBox.show(fnError, {
				icon: sap.m.MessageBox.Icon.ERROR,
				title: "Error"
			}); 
		}
		
	}

	return _oService;

});