sap.ui.define([
	"com/bosch/sd/shipq/controller/BaseController",
	"sap/base/security/URLWhitelist"
	
], function( BaseController, URLWhitelist ) {
	"use strict";

	return BaseController.extend("com.bosch.sd.shipq.controller.App", {
		onInit: function () {
			var oRouter = this.getRouter();
			oRouter.getRoute("ConnectionTest").attachPatternMatched(this._onObjectMatched, this);
		},

		// *** callback function for routing on detail view
		_onObjectMatched : function (oEvent) {
		},
		
		onSelectDocument: function( oEvent ) {
			
			var oPdfViewer = this.getView().byId( "idPdfViewer_conn" );
			var oImage = this.getView().byId( "idImage1_conn" );
			
			var oDeviceModel = this.getView().getModel("device");
			var useLink = !oDeviceModel.getData().isDesktop;
			if( oPdfViewer !== undefined ) {
				oPdfViewer.setDisplayType( !useLink ? sap.m.PDFViewerDisplayType.Auto : sap.m.PDFViewerDisplayType.Link );
			}
			
			if( oEvent !== undefined && oEvent.getSource() !== undefined ) {
				var oContext = oEvent.getParameter( "listItem" ).getBindingContext();
				if( oContext !== undefined && oContext !== null) {
					var plantId = oContext.getProperty( "PlantId" );
					var fileName = oContext.getProperty( "FileName" );

					var oModel = this.getView().getModel();
					var that = this;
					
					oModel.read( "/ShippingDocuments(PlantId='" + plantId + "',FileName='" + fileName + "')", { success: function( data, response ) 
					{
					     	if( data.MIME === "application/pdf") {
						  		var pdfBase64 = data.Document;
						  		if( pdfBase64 !== undefined && pdfBase64 !== "" ) {
						  			var decodedPdfContent = atob( pdfBase64 );
									var byteArray = new Uint8Array( decodedPdfContent.length );
									for(var i = 0; i < decodedPdfContent.length; i++){
									    byteArray[i] = decodedPdfContent.charCodeAt(i);
									}
									var blob = new Blob([byteArray.buffer], { type: "application/pdf" });
									var _pdfurl = URL.createObjectURL( blob );
								
									URLWhitelist.add("blob"); // register blob url as whitelist
									oPdfViewer.setVisible(true);
									oImage.setVisible(false);
									oPdfViewer.setSource( _pdfurl );
									oPdfViewer.setTitle( fileName );
									
									if( useLink ) {
										oPdfViewer.downloadPDF();
									}
						  		}
					     	}
					     	else {
					     		oImage.setVisible(true);
					     		oPdfViewer.setVisible(false);
					     		var p = oContext.getPath();
					     		oImage.bindElement( {path: p} );
					     	}
					  		
			        		
			        		//oBusyDialog.close();
					     	
					     },
					     
					     error:  function()
					     {
					     	//oBusyDialog.close();
							var sError = that.getRessourceText( "errorOData" );
							var sTitle = that.getRessourceText( "errorMsgTitle" );
							sap.m.MessageBox.error( sError , { title: sTitle } );
					     } 
					});
				}
			}
		}
	});
});