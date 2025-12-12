sap.ui.define([
	"com/bosch/sd/shipq/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/base/security/URLWhitelist",
	"com/bosch/sd/shipq/model/dateFormatter"

], function (BaseController, JSONModel, Filter, FilterOperator, URLWhitelist, dateFormatter) {
	"use strict";

	return BaseController.extend("com.bosch.sd.shipq.controller.DisplayResult", {

		dateFormatter: dateFormatter,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.bosch.scm.SmartDispatchPrototype.view.NotFound
		 */
		onInit: function () {
			BaseController.prototype.onInit.apply(this);
			this.getRouter().getRoute("DisplayResult").attachPatternMatched(this._onObjectMatched, this);
		},

		onPressReset: function (oEvent) {
			var oFilters = this.getView().getModel("filters");
			if (oFilters !== undefined) {
				oFilters.setProperty("/resetInputPage", true);
			}
			this.getRouter().navTo("scanInput");
		},

		// *** was asked for but not yet confirmed; keep as reference
		/*
		onPressToggleHeader: function (oEvent) {
			var oInputPanel = this.byId( "InputPanelId" );
			var oListPanel = this.byId( "ListPanelId" );
			oInputPanel.setVisible( !oInputPanel.getVisible() );
			oListPanel.setVisible( !oListPanel.getVisible() );
		},
		*/

		onBeforeRendering: function () {
			var oPdfViewer = this.getView().byId("idPdfViewer");
			var oDeviceModel = this.getView().getModel("device");
			if (oPdfViewer !== undefined && oPdfViewer !== undefined) {
				this._useLink = !oDeviceModel.getData().isDesktop;
				oPdfViewer.setDisplayType(!this._useLink ? sap.m.PDFViewerDisplayType.Auto : sap.m.PDFViewerDisplayType.Link);
			}
		},

		onSourceValidationFailed: function (oEvent) {
			oEvent.preventDefault();
		},

		onSelectionChange: function (oEvent) {
			var that = this;
			if (oEvent !== undefined && oEvent.getSource() !== undefined) {
				var oContext = oEvent.getParameter("listItem").getBindingContext();
				if (oContext !== undefined && oContext !== null) {
					var plantId = oContext.getProperty("PlantId");
					var fileName = oContext.getProperty("FileName");

					//var oModel = this.getView().getModel();
				

					/* this._oBusyDialog = new sap.m.BusyDialog();
					this._oBusyDialog.open();

					oModel.read("/DocumentContentSet(PlantId='" + plantId + "',FileName='" + fileName + "')", {
						success: function (data, response) {
							var contentPath = "/DocumentContentSet(PlantId='" + data.PlantId + "',FileName='" + data.FileName + "')";
							that._showDocument(that, data, fileName, contentPath);
						},

						error: function () {
							that._oBusyDialog.close();
							var sError = that.getRessourceText("errorOData");
							var sTitle = that.getRessourceText("errorMsgTitle");
							sap.m.MessageBox.error(sError, {
								title: sTitle
							});
						}
					}); */

                //Call odata v4
                var aFilters = [];
                let aFilter = {};
                aFilter = new sap.ui.model.Filter({path: "PlantId", operator: sap.ui.model.FilterOperator.EQ, value1: plantId });
                aFilters.push(aFilter);
                aFilter = new sap.ui.model.Filter({path: "FileName", operator: sap.ui.model.FilterOperator.EQ, value1: fileName });
                aFilters.push(aFilter);

                this.setBusy(true);
                this.getService().getDocument_ContentSet(aFilters).then(function (data) { 
                    if(data){   
						this.setBusy(false);
						debugger;
                        var contentPath = "/xRB1MxSD_C_Document_Content(PlantId='" + data[0].PlantId + "',FileName='" + data[0].FileName + "')";
                        that._showDocument(that, data[0], data[0].FileName,data[0].FileName, contentPath)     
                    }
                    this.setBusy(false);           
                }.bind(this), function (oError) {
                    this.setBusy(false);     
                    var e = that.getRessourceText("errorOData");
                    var t = that.getRessourceText("errorMsgTitle");
                    sap.m.MessageBox.error(e, {title: t})                   
                }.bind(this));

				}
			}
		},

		_showDocument: function (oContext, data, dateraw, titel, contentPath) {
			debugger;
			var oPdfViewer = oContext.getView().byId("idPdfViewer");
			var oImage = oContext.getView().byId("idImage1");
			var text = oContext.getView().byId("docTitle");
			text.setVisible(true);
			text.setText(dateraw);
			//if (dateraw instanceof Date === true) {
			 if (this.fnStringIsValidDate(dateraw) == true) {
				var year = dateraw.getFullYear();
				var month = dateraw.getMonth();
				var date = dateraw.getDate();
				var year1 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).getFullYear();
				var month1 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).getMonth();
				var date1 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).getDate();
				var dateCompare = new Date(year, month, date) > new Date(year1, month1, date1);
				if (dateCompare === true) {
					text.addStyleClass("yellowTxtHlight");
				} else {
					text.removeStyleClass("yellowTxtHlight");
				}
				text.setText(titel);
			}
			if (data.MIME === "application/pdf") {
				var pdfBase64 = data.Document;
				if (pdfBase64 !== undefined && pdfBase64 !== "") {
					var decodedPdfContent = atob(pdfBase64);
					var byteArray = new Uint8Array(decodedPdfContent.length);
					for (var i = 0; i < decodedPdfContent.length; i++) {
						byteArray[i] = decodedPdfContent.charCodeAt(i);
					}
					var blob = new Blob([byteArray.buffer], {
						type: "application/pdf"
					});
					var pdfurl = URL.createObjectURL(blob);

					URLWhitelist.add("blob"); // register blob url as whitelist
					oPdfViewer.setVisible(true);
					oImage.setVisible(false);
					oPdfViewer.setSource(pdfurl);
					// oPdfViewer.setTitle(titel);
					//oPdfViewer.open();			// opens in pop-up; if required

					if (oContext._useLink) {
						oPdfViewer.downloadPDF();
					}
				}
			} else {
				// var text = oContext.getView().byId("docTitle");
				// text.setVisible(true);
				// text.setText(titel);
				oImage.setVisible(true);
				oPdfViewer.setVisible(false);
				//var p = bindingContext.getPath();
				oImage.bindElement({
					path: contentPath
				});
			}

			// only on desktop: collapse list
			if (!oContext._useLink) {
				oContext.getView().byId("idIconTabBarNoIcons").setExpanded(false);
			}
		},
		 
		fnFormatDateUI5Display: function (e) {
            if (isNaN(new Date(e))) {
                return ""
            }
            var t = e.getDate();
            var a = e.getMonth() + 1;
            var r = e.getFullYear();
            if (t < 10) {
                t = "0" + t
            }
            if (a < 10) {
                a = "0" + a
            }
            var n = t + "." + a + "." + r;
            return n
        },
		fnStringIsValidDate: function(dateString) {
		const date = new Date(dateString);
		// Check if the date object is valid (its valueOf() is not NaN)
		 return !isNaN(date.valueOf());
		},
		_onObjectMatched: function (oEvent) {
			var oFilters = this.getView().getModel("filters");
			if (oFilters !== undefined) {
				var dateraw = oFilters.oData.UploadDate;
				var date = dateraw;
				//date = sap.ui.core.format.DateFormat.getDateInstance({style: "medium", pattern: "yyyy-MM-ddTHH:mm:ss"}).format(date);
				date = new Date(date)
				dateraw = date;
				//date = sap.ui.core.format.DateFormat.getDateInstance({style: "medium", pattern: "yyyy-MM-ddTHH:mm:ss"}).format(date);
				//dateraw =  date;
				date = "Upload Date:".concat(" ", dateFormatter.dateText(oFilters.oData.UploadDate));

				//dateraw =  sap.ui.core.format.DateFormat.getDateInstance({style: "medium", pattern: "yyyy-MM-ddTHH:mm:ss"}).format(new Date(oFilters.oData.UploadDate));;

				oFilters.setProperty("/lockConfirm", false);
				var nHits = oFilters.getProperty("/numberOfHits");
				var oList = this.getView().byId("PackInstList");

				var oTabBar = this.getView().byId("idIconTabBarNoIcons");
				var oListTab = this.getView().byId("iconTabFilterList");

				var oBinding = oList.getBinding("items");
				if(oBinding){
					oBinding.aApplicationFilters = [];
					oBinding.aFilters = [];
					//	oBinding.suspend(); // just in case;

				}
				var oMsgStrip = this.getView().byId("MsgStrip");
				if (oFilters.getProperty("/InfoText").length > 0 && oFilters.getProperty("/InfoType") !== "None") {
					oMsgStrip.setVisible(true);
				} else {
					oMsgStrip.setVisible(false);
				}

				switch (nHits) {

				case 0:
					this.getRouter().navTo("notFound");
					break;

				case 1:
					oTabBar.setExpanded(false);

					// note: we could enable the 'found Documents' tab also for single hit mode
					//       but currently it would not show any doc metadata; reason: we directly fetch the contents
					//       and don't transport the metadata!!
					oListTab.setVisible(false);

					var data = {
						Mime: "",
						Document: ""
					};
					data.MIME = oFilters.getProperty("/Mime");
					data.Document = oFilters.getProperty("/Document");
					var fileName = oFilters.getProperty("/fileName");
					var strContext = oFilters.getProperty("/imgContext");
					//var oContext = this.getView().getModel().getContext( strContext );
					//this._oBusyDialog = new sap.m.BusyDialog();
					//this._oBusyDialog.open();
					fileName = fileName.concat(Array(30).fill('\xa0').join(''), date);
					debugger;
					if(data.Document){
						if(data.Document.length>0){
							oMsgStrip.setVisible(false);
							//this.setBusy(true);
							this._showDocument(this, data, dateraw, fileName, strContext);
						}
					}
					else{
						//errorTxtBackendText
						 oFilters.setProperty("/InfoText", this.getRessourceText("errorTxtBackendText"));
						 oFilters.setProperty("/InfoType", "Error");
						 oMsgStrip.setVisible(true);
						// sap.m.MessageBox.error( this.getRessourceText("errorTxtBackendText"), {title: this.getRessourceText("errorMsgTitle")})   
					}
					
					break;

				default:
					this.setBusy(true);
					oMsgStrip.setVisible(false);
					oListTab.setVisible(true);
					oTabBar.setExpanded(true);
					oTabBar.setSelectedKey("listTab");

					oList.removeSelections(true);

					this.getView().byId("idPdfViewer").setVisible(false);
					this.getView().byId("idImage1").setVisible(false);

					var aTempFilter = [];
					aTempFilter.push(new Filter("PlantId", FilterOperator.EQ, oFilters.getProperty("/PlantId")));

					if (oFilters.getProperty("/MaterialNumber").length > 0) {
						aTempFilter.push(new Filter("MaterialNumber", FilterOperator.EQ, oFilters.getProperty("/MaterialNumber")));
					}
					if (oFilters.getProperty("/ShipToParty").length > 0) {
						aTempFilter.push(new Filter("ShipToParty", FilterOperator.EQ, oFilters.getProperty("/ShipToParty")));
					}
					if (oFilters.getProperty("/HandlingUnit").length > 0) {
						aTempFilter.push(new Filter("ExternalId", FilterOperator.EQ, oFilters.getProperty("/HandlingUnit")));
					}
					if (oFilters.getProperty("/DeliveryId").length > 0) {
						aTempFilter.push(new Filter("DeliveryId", FilterOperator.EQ, oFilters.getProperty("/DeliveryId")));
					}
					if (oFilters.getProperty("/PackingInstruction").length > 0) {
						aTempFilter.push(new Filter("PackingInstruction", FilterOperator.EQ, oFilters.getProperty("/PackingInstruction")));
					}
					if (oFilters.getProperty("/ShowAllDocs") === true) {
						aTempFilter.push(new Filter("ShowAllDocs", FilterOperator.EQ, oFilters.getProperty("/ShowAllDocs")));
					}

				 	var filter = new Filter({
						filters: aTempFilter,
						and: true
					});
					if(oBinding){
						oBinding.filter(filter);
						if (oBinding.isSuspended()) {
							//oBinding.resume();
						}
						oBinding.refresh();
					}
					this.setBusy(false);
					break;
				}
			}
		}
	});
});