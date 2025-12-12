sap.ui.define([
	"com/bosch/sd/shipq/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/ws/SapPcpWebSocket",
	"sap/m/MessageToast",
	"sap/ui/core/CustomData",
	"sap/ndc/BarcodeScanner"

], function (BaseController, JSONModel, SapPcpWebSocket, MessageToast, CustomData, BarcodeScanner) {
	"use strict";

	return BaseController.extend("com.bosch.sd.shipq.controller.ScanInput", {
		onInit: async function () {
			BaseController.prototype.onInit.apply(this);
			this._oVM = this.getView().byId("variantManagement");
			var oPrinter = new JSONModel({
				aGates: []
			});
			this.getOwnerComponent().setModel(oPrinter, "selectionModel");
			//this.getRouter().getRoute("scanInput").attachPatternMatched(this._onSelectionRouteMatched, this);

			this.getView().byId("_IDEGen_hbox8").setVisible(false);

			var oPackCtrl = this.getView().byId("inputPackInstr");
			var that = this;

			// resize the Packing Instruction input after it was rendered
			oPackCtrl.onAfterRendering = function () {

				// refetch the control; bc it is not fully constructed in onInit and '.setWidth' is not available there
				var oPackCtrl1 = that.getView().byId("inputPackInstr");
				var oHUCtrl = that.getView().byId("inputHu");
				var oBtn = that.getView().byId("_IDEGen_button0");

				var width = oHUCtrl.$().width() + oBtn.$().width();
				var strWidth = width + "px";
				oPackCtrl1.setWidth(strWidth);
			};

			// enable browser events; don't use SAPUI5 events!
			// Reason: in chrome if onChange of Input field and onPress of Button happen at same time
			//         => onPress is not triggered; only onChange; 
			//         => this leads to Confirm Button has to be pressed twice! Bad UX.
			// Solution: https://answers.sap.com/questions/12843483/ui5-sapminput-change-event-interferes-with-sapmbut.html

			var filterPlant = this.getView().byId("inputPlant");
			var filterHu = this.getView().byId("inputHu");
			var filterMatNr = this.getView().byId("inputMatnr");
			var filterDelivery = this.getView().byId("inputDlv");
			var filterShipTo = this.getView().byId("inputShipTo");
			var filterPack = this.getView().byId("inputPackInstr");
			var filterAllDocs = this.getView().byId("inputAllDocs");

			filterPlant.attachBrowserEvent("change", this._changeInputRedirect.bind(event, this, "inputPlant"));
			filterHu.attachBrowserEvent("change", this._changeInputRedirect.bind(event, this, "inputHu"));
			filterMatNr.attachBrowserEvent("change", this._changeInputRedirect.bind(event, this, "inputMatnr"));
			filterDelivery.attachBrowserEvent("change", this._changeInputRedirect.bind(event, this, "inputDlv"));
			filterShipTo.attachBrowserEvent("change", this._changeInputRedirect.bind(event, this, "inputShipTo"));
			filterPack.attachBrowserEvent("change", this._changeInputRedirect.bind(event, this, "inputPackInstr"));
			//filterAllDocs.attachBrowserEvent( "select", this._changeInputRedirect.bind( event, this, "inputAllDocs"  ) );

			var oBtn = this.getView().byId("_IDEGen_button4");
			oBtn.attachBrowserEvent("mousedown", this._pressConfirmRedirect.bind(event, this));
			oBtn.attachBrowserEvent("keyup", this._pressConfirmByReturnRedirect.bind(event, this));
			// Initialize the View model for variant items
            const oViewModel = new JSONModel({
                selectedKey: "",
                variants: []
            });
            this.getView().setModel(oViewModel, "view");
             // Initialize Personalization container
             await this._initPersonalization();
            // Load stored variants
            await this._loadVariants();
		},
		_onSelectionRouteMatched: function (e) {
			/* var t = this.getOwnerComponent().getModel("selectionModel").getProperty("/aGates");
			if (t.length === 0) {
				this.getOwnerComponent().getModel().metadataLoaded().then(function () {
					this.getOwnerComponent().getModel().read("/PrinterDataSet", {
						success: function (e, t) {
							var o = this.getOwnerComponent().getModel("selectionModel");
							o.setProperty("/aGates", e.results);
							var t = this.getView().byId("inputPlant");
							if (e.results.length !== 0) {
								t.setValue(e.results[0].Werks);
							}
							if (t.getValue() === "058W") {
								this.getView().byId("_IDEGen_hbox8").setVisible(true);
								var oViewModel = new JSONModel({
									HU: "",
									Plant: "",
									// Shipto: "",
									Printer: "",
									Type: ""
								});
								this.getOwnerComponent().setModel(oViewModel, "inputView");
								this._oViewModel = oViewModel;
								this.initHUFeed();
							}
						}.bind(this),
						error: function (event) {
							// this.getModel("selectionModel").setProperty("/isLoadingInProgess", false)
						}
					})
				}.bind(this))
			} */
		},

		initHUFeed: function () {
			var that = this;
			var oWebSocket,
				webSocketURI = "/sap/bc/apc/rb0g/sd_shipq_apc";
			try {
				oWebSocket = new SapPcpWebSocket(webSocketURI, SapPcpWebSocket.SUPPORTED_PROTOCOLS.v10);
				oWebSocket.attachOpen(function (oEvent) {
					MessageToast.show("Websocket connection opened");
				});

				oWebSocket.attachClose(function (oEvent) {
					MessageToast.show("Websocket connection closed");
					var oCloseParams = oEvent.getParameters();

					// window.setTimeout(function () {
					// 	// If we intentionally close the Push channel, we close it with specific code and reason
					// 	if (oCloseParams.code !== this._iCloseCode || oCloseParams.reason !== this._sCloseReason) {
					// 		// If this._oWebSocket is not null, we did not intend to close WebSocket
					// 		if (this._oWebSocket !== null) {
					// 			// try to open new WebSocket
					// 			this.initHUFeed();
					// 		}
					// 	}
					// }.bind(this), 1000);
					// }.bind(this));
				}, this);

				oWebSocket.attachMessage(function (oEvent) {
					if (oEvent.getParameter("pcpFields").errorText) {
						// Message is an error text
						return;
					}
					var oArgs = JSON.parse(oEvent.getParameter("data"));
					this._oViewModel.setProperty("/HU", oArgs.HU);
					this._oViewModel.setProperty("/Plant", oArgs.Plant);
					// this._oViewModel.setProperty("/Shipto", oArgs.Shipto);
					this._oViewModel.setProperty("/Printer", oArgs.Printer);
					this._oViewModel.setProperty("/Type", oArgs.Type);

					// var oEntry = JSON.parse(oEvent.getParameter("data")),
					// 	sHU = this._oViewModel.getProperty("/HU"),
					// 	sPlant = this._oViewModel.getProperty("/Plant"),
					// 	// sShipto = this._oViewModel.getProperty("/Shipto"),
					// 	sPrinter = this._oViewModel.getProperty("/Printer"),
					// 	sType = this._oViewModel.getProperty("/Type");
					if (oArgs.Printer === that.getView().byId("inputPrinter").getSelectedKey() && oArgs.Type === 'X') {
						that.getView().byId("inputHu").setValue(oArgs.HU);
						if (that.getView().byId("inputPlant").getValue() === oArgs.Plant) {
							that.getView().byId("inputPlant").setValue(oArgs.Plant);
						}
						// that.getView().byId("inputShipTo").setValue(sShipto);
						this._doConfirmAction();
					} else if (oArgs.Printer === that.getView().byId("inputPrinter").getSelectedKey() && oArgs.Type === 'Y') {
						this.getRouter().navTo("scanInput");
						this.onPressReset();
					}
				}, this);

				this._oWebSocket = oWebSocket;
			} catch (exception) {
				this._oWebSocket = null;
			}
		},

		onBeforeRendering: function () {
			// clear fields when navigate on to this side
			this.getRouter().getRoute("scanInput").attachPatternMatched(this._onObjectMatched, this);
		},

		onAfterRendering: function () {

			// it seems that the framework always sets the cursor to first page control after 
			// all possible events. So, we set the focus delayed to overwrite frameworks decision.
			var delay = this.getTechnicalProperty("delaySetCursorMs");
			var oInputHu = this.getView().byId("inputHu");
			setTimeout(function () {
				oInputHu.focus();
			}, delay);
		},
		onPressScan: function (oEvent) {
			var input = oEvent.getSource().getCustomData()[0].getValue();
			BarcodeScanner.scan(
				function (mResult) {
					var oInput = this.getView().byId(input);
					if (!mResult.cancelled && oInput !== undefined) {

						oInput.setValue(mResult.text);

						// in case of HU or DLVNote scan => directly show documents
						if ((input === "inputHu" || input === "inputDlv") && (mResult.text !== "")) {
							this._doConfirmAction();
						}

					}
				}.bind(this),
				function (Error) {
					this.getView().byId(input).setValue("");
				}
			);
		},

		onAllDocsSelect: function (oEvent) {
			this._updateFilterModel();
			// note: customer request unclear; do they want to check for a proposal when setting the flag?
			//       assumption: no; if they want then call next line instead of just updating the filter model
			//this.onChangeInput( oEvent, "inputAllDocs", false );
		},

		onChangeInput: function (oEvent, strSource, bPressConfirm) {		
			this._updateFilterModel();
			var oFilterModel = this.getView().getModel("filters");
			// remember the last input field to restore focus later 
			oFilterModel.setProperty("/lastInputControlId", strSource);
			this._oVM.setModified(true);
			//Call odata v4
             // read from backend
            var aFilters = [];
            aFilters = this.fnGetFilterData(oFilterModel);
			var that = this;
             this.setBusy(true);
             this.getService().getShipping_DocumentSet(aFilters).then(function (oData) { 
                if(oData){   
					if(oData.length == 1){
						 if (oData[0].ErrorCode === undefined || oData[0].ErrorCode === 0) {
                        if (oData[0].ExternalId !== undefined) {
                            that.getView().byId("inputHu").setValue(oData[0].ExternalId)
                        }
                        if (oData[0].MaterialNumber !== undefined) {
                            that.getView().byId("inputMatnr").setValue(oData[0].MaterialNumber)
                        }
                        if (oData[0].DeliveryId !== undefined) {
                            that.getView().byId("inputDlv").setValue(oData[0].DeliveryId)
                        }
                        if (oData[0].ShipToParty !== undefined) {
                            that.getView().byId("inputShipTo").setValue(oData[0].ShipToParty)
                        }
                        if (oData[0].PackingInstruction !== undefined) {
                            that.getView().byId("inputPackInstr").setValue(oData[0].PackingInstruction)
                        }
                    }
					}    
					 that._setConfirmButtonState(that, bPressConfirm)             
                }
                this.setBusy(false);           
            }.bind(this), function (oError) {
                 this.setBusy(false);   
				  that._setConfirmButtonState(that, bPressConfirm)                               
            }.bind(this));
		},

		onPressConfirm: function (oEvent) {

			this._doConfirmAction();
		},

		onPressReset: function (oEvent) {
			this._resetPage();
		},
		fnGetFilterData: function(i){
             var aFilters = [];
             let aFilter = {};
             aFilter = new sap.ui.model.Filter({path: "PlantId", operator: sap.ui.model.FilterOperator.EQ, value1: i.getProperty("/PlantId") });
             aFilters.push(aFilter);
             aFilter = new sap.ui.model.Filter({path: "MaterialNumber", operator: sap.ui.model.FilterOperator.EQ, value1: i.getProperty("/MaterialNumber") });
             aFilters.push(aFilter);
             aFilter = new sap.ui.model.Filter({path: "ShipToParty", operator: sap.ui.model.FilterOperator.EQ, value1: i.getProperty("/ShipToParty") });
             aFilters.push(aFilter);
             aFilter = new sap.ui.model.Filter({path: "ExternalId", operator: sap.ui.model.FilterOperator.EQ, value1: i.getProperty("/HandlingUnit") });
             aFilters.push(aFilter);
             aFilter = new sap.ui.model.Filter({path: "DeliveryId", operator: sap.ui.model.FilterOperator.EQ, value1: i.getProperty("/DeliveryId") });
             aFilters.push(aFilter);
             aFilter = new sap.ui.model.Filter({path: "PackingInstruction", operator: sap.ui.model.FilterOperator.EQ, value1: i.getProperty("/PackingInstruction") });
             aFilters.push(aFilter);
             aFilter = new sap.ui.model.Filter({path: "ShowAllDocs", operator: sap.ui.model.FilterOperator.EQ, value1: i.getProperty("/ShowAllDocs") });
             aFilters.push(aFilter);

             return aFilters;
        },

		// ***
		// helpers 
		// ***

		_doConfirmAction: function () {
			this._clearFilterModel();

			// debug: go to connection test page
			if (this.getView().byId("inputPlant").getValue() === "_711") {
				this.getRouter().navTo("ConnectionTest");
			} else {

				// build filter string
				// ?$filter=PlantId eq '1400' and MaterialNumber eq '0024032C01' and ShipToParty eq '0056754492'
				this._updateFilterModel();
				var oFilterModel = this.getView().getModel("filters");

				var that = this;
				var aFilters = [];
                aFilters = this.fnGetFilterData(oFilterModel);
				//add IncreaseCount
				 //var aFilters = [];
				let aFilter = {};
				let _IncreaseCount = true;
				aFilter = new sap.ui.model.Filter({path: "IncreaseCount", operator: sap.ui.model.FilterOperator.EQ, value1: _IncreaseCount } );
				aFilters.push(aFilter);
                var that = this;
                //Call odata v4
                this.setBusy(true);
                this.getService().getShipping_DocumentSet(aFilters).then(function (oData) { 
                    if(oData){   
                        var i = [];
                            i = oData;
                            var s = i[0].ErrorCode;
                            var a = that.getRessourceText("errorTxtBackendText");
                            var l = "";
                            switch (i.length) {
                                case 0: 
                                    oFilterModel.setProperty("/numberOfHits", 0);
                                    oFilterModel.seteProperty("/lockConfirm", false);
                                    oFilterModel.setProperty("/fileName", "");
                                    that.showErrorDialog(a);
                                    break;
                                case 1:
                                    if (s === undefined || i[0].ErrorCode === 0) {
                                        oFilterModel.setProperty("/numberOfHits", 1);
                                        oFilterModel.setProperty("/fileName", i[0].FileName);
                                        oFilterModel.setProperty("/Mime", i[0].MIME);
                                        oFilterModel.setProperty("/UploadDate", i[0].UploadDate);
                                        oFilterModel.setProperty("/Document", i[0].Document);
                                        oFilterModel.setProperty("/imgContext", "/xRB1MxSD_C_Document_Content(PlantId='" + oFilterModel.getProperty("/PlantId").toUpperCase() + "',FileName='" + i[0].FileName + "')");
                                        if (i !== undefined && i[0] !== undefined && i[0].InfoMsgId !== undefined && i[0].InfoMsgId.length > 0 && i[0].InfoMsgType !== undefined && i[0].InfoMsgType.length > 0) {
                                            l = that.getRessourceText("infoTxtBackendDetail" + i[0].InfoMsgId);
                                            if (l !== undefined && l.length > 0) {
                                                oFilterModel.setProperty("/InfoText", l);
                                                oFilterModel.setProperty("/InfoType", i[0].InfoMsgType)
                                            }
                                        }
                                        that.getRouter().navTo("DisplayResult")
                                    } else {
                                        oFilterModel.setProperty("/numberOfHits", 0);
                                        oFilterModel.setProperty("/fileName", "");
                                        oFilterModel.setProperty("/lockConfirm", false);
                                        var u = that.getRessourceText("errorTxtBackendDetail" + s);
                                        that.showErrorDialog(a + "\n" + u)
                                    }
                                    break;
                                default: 
                                    oFilterModel.setProperty("/numberOfHits", i.length);
                                    oFilterModel.setProperty("/fileName", "");
                                    if (i !== undefined && i[0] !== undefined && i[0].InfoMsgId !== undefined && i[0].InfoMsgId.length > 0 && i[0].InfoMsgType !== undefined && i[0].InfoMsgType.length > 0) {
                                        l = that.getRessourceText("infoTxtBackendDetail" + i[0].InfoMsgId);
                                        if (l !== undefined && l.length > 0) {
                                           oFilterModel.setProperty("/InfoText", l);
                                           oFilterModel.setProperty("/InfoType", i[0].InfoMsgType)
                                        }
                                    }
                                   that.getRouter().navTo("DisplayResult")
                            }
                    }
                    this.setBusy(false);           
                }.bind(this), function (oError) {
                    var e = that.getRessourceText("errorOData");
                    var t = that.getRessourceText("errorMsgTitle");
                    sap.m.MessageBox.error(e, {title: t});
                    var r = this.getView().getModel("filters");
                    if (r !== undefined) {
                        r.setProperty("/lockConfirm", false)
                    }
                    this.setBusy(false);                        
                }.bind(this));
			}
		},

		// we need this redirect in order to attach somehow the original SAPUI5 object (this context) to a browser event
		_changeInputRedirect: function (oContext, strSource, oEvent) {
			var val = oContext.getView().byId(strSource).getValue();
			var bPressConfirm = (strSource === "inputHu" || strSource === "inputDlv") && (val !== "");
			oContext.onChangeInput(oContext, strSource, bPressConfirm);
		},

		_pressConfirmRedirect: function (oContext, oEvent) {
			// note: press button event and onChange event of HU / DelNote both trigger  
			//       pressConfirm. They may be fired at same time so we only want to
			//       allow one trigger in order to assure correct document count
			var oFilters = oContext.getView().getModel("filters");
			if (oFilters !== undefined) {
				var isLocked = oFilters.getProperty("/lockConfirm");
				if (!isLocked) {
					oContext.onPressConfirm(oContext);
					oFilters.setProperty("/lockConfirm", true);
				}
			}
		},

		_pressConfirmByReturnRedirect: function (oContext, oEvent) {
			var oFilters = oContext.getView().getModel("filters");
			if (oFilters !== undefined) {
				var isLocked = oFilters.getProperty("/lockConfirm");
				if (!isLocked) {
					if (event.keyCode === 13) {
						oContext.onPressConfirm(oContext);
						oFilters.setProperty("/lockConfirm", true);
					}
				}
			}
		},

		_resetPage: function () {
			this._setFocusLastInputControl();
			this._clearInputFields();
			this._clearFilterModel();
			this._setConfirmButtonState(this);
		},

		_setConfirmButtonState: function (oContext, bPressConfirm) {
			if (oContext !== undefined) {

				// note: was old logic to enable Confirm button;
				//       was changed but keep for reference

				//var filterPlant = oContext.getView().byId("inputPlant").getValue();
				// var filterHu = oContext.getView().byId("inputHu").getValue();
				// var filterMatNr = oContext.getView().byId("inputMatnr").getValue();
				// var filterDelivery = oContext.getView().byId("inputDlv").getValue();
				// var filterShipTo = oContext.getView().byId("inputShipTo").getValue();
				// var filterPack = oContext.getView().byId("inputPackInstr").getValue();

				var bState = true; // ( filterPlant !== undefined && filterPlant.length > 0 ); //&&
				//  ( ( filterHu    !== undefined && filterHu.length > 0 ) || 
				//( filterMatNr !== undefined && filterMatNr.length > 0 ) || 
				//( filterDelivery !== undefined && filterDelivery.length > 0 ) || 
				//( filterShipTo    !== undefined && filterShipTo.length > 0 ) || 
				//( filterPack    !== undefined && filterPack.length > 0 )
				//  );
				oContext.getView().byId("_IDEGen_button4").setEnabled(bState);

				if (bState) {
					var delay = oContext.getTechnicalProperty("delaySetCursorMs");
					var oFilters = this.getView().getModel("filters");
					if (oFilters !== undefined) {
						var bIsLocked = oFilters.getProperty("/lockConfirm");
						// need to be set here; in timeout handler Filters object not available
						if (bPressConfirm && !bIsLocked) {
							oFilters.setProperty("/lockConfirm", true);
						}

						setTimeout(function () {
							oContext.getView().byId("_IDEGen_button4").focus();
							if (bPressConfirm && !bIsLocked) {
								oContext.onPressConfirm(oContext);
							}
						}, delay);
					}
				}
			}
		},

		_updateFilterModel: function () {

			var filterPlant = this.getView().byId("inputPlant").getValue();
			var filterHu = this.getView().byId("inputHu").getValue();
			var filterMatNr = this.getView().byId("inputMatnr").getValue();
			var filterDelivery = this.getView().byId("inputDlv").getValue();
			var filterShipTo = this.getView().byId("inputShipTo").getValue();
			var filterPack = this.getView().byId("inputPackInstr").getValue();
			var filterAllDocs = this.getView().byId("inputAllDocs").getSelected();

			var oFilterModel = this.getView().getModel("filters");
			if (oFilterModel !== undefined) {
				oFilterModel.setProperty("/PlantId", filterPlant);
				oFilterModel.setProperty("/HandlingUnit", filterHu);
				oFilterModel.setProperty("/MaterialNumber", filterMatNr);
				oFilterModel.setProperty("/ShipToParty", filterShipTo);
				oFilterModel.setProperty("/DeliveryId", filterDelivery);
				oFilterModel.setProperty("/PackingInstruction", filterPack);
				oFilterModel.setProperty("/ShowAllDocs", filterAllDocs);
			}
		},

		_clearFilterModel: function () {
			var oFilterModel = this.getView().getModel("filters");
			if (oFilterModel !== undefined) {
				oFilterModel.setProperty("/PlantId", "");
				oFilterModel.setProperty("/HandlingUnit", "");
				oFilterModel.setProperty("/MaterialNumber", "");
				oFilterModel.setProperty("/ShipToParty", "");
				oFilterModel.setProperty("/DeliveryId", "");
				oFilterModel.setProperty("/PackingInstruction", "");
				oFilterModel.setProperty("/numberOfHits", 0);
				oFilterModel.setProperty("/fileName", "");
				oFilterModel.setProperty("/Document", "");
				oFilterModel.setProperty("/InfoText", "");
				oFilterModel.setProperty("/InfoType", "None");
				oFilterModel.setProperty("/ShowAllDocs", false);
				oFilterModel.setProperty("/lockConfirm", false);
				// don't clear: lastFocusId, resetInputPage
			}
		},

		_clearInputFields: function () {
			this.getView().byId("inputPackInstr").setValue("");
			this.getView().byId("inputDlv").setValue("");
			this.getView().byId("inputShipTo").setValue("");
			this.getView().byId("inputHu").setValue("");
			this.getView().byId("inputMatnr").setValue("");
			this.getView().byId("inputAllDocs").setSelected(false);
		},

		_setFocusLastInputControl: function () {
			var oFilterModel = this.getView().getModel("filters");
			var oLastInputControl = this.getView().byId(oFilterModel.getProperty("/lastInputControlId"));
			var delay = this.getTechnicalProperty("delaySetCursorMs");
			// it seems that the framework always sets the cursor to first page control after 
			// all possible events. So, we set the focus delayed to overwrite frameworks decision.
			if (oLastInputControl !== undefined) {
				setTimeout(function () {
					oLastInputControl.focus();
				}, delay);
			}
		},

		_onObjectMatched: function (oEvent) {
			var doReset;
			var oFilters = this.getView().getModel("filters");
			if (oFilters !== undefined) {
				doReset = oFilters.getProperty("/resetInputPage");
				if (doReset && doReset === true) {
					this._resetPage();
				}
				oFilters.setProperty("/resetInputPage", false);
			}
			this._setFocusLastInputControl();
		},
		 /** -------------------------------------------
         *  PERSONALIZATION INITIALIZATION
         *  -------------------------------------------
         */
        _initPersonalization: async function () {
            const oPersService = await sap.ushell.Container.getServiceAsync("Personalization");
            this._oPersContainer = await new Promise((resolve, reject) => {
                const oScope = { keyCategory: oPersService.constants.keyCategory.FIXED_KEY,
                                writeFrequency: oPersService.constants.writeFrequency.LOW,
                                clientStorageAllowed: true };

                oPersService.getPersonalizationContainer("comboschsdshipq", oScope)
                .done(resolve)
                .fail(reject);
            });
        },
         /** -------------------------------------------
         *  LOAD VARIANTS FROM PERSISTENCE
         *  -------------------------------------------
         */
        _loadVariants: async function () {
            const oContainer = this._oPersContainer;
            const oVariantData = oContainer.getItemValue("variants") || [];

            const oModel = this.getView().getModel("view");
            oModel.setProperty("/variants", oVariantData);

            if (oVariantData.length) {
                for(let i =0 ; i < oVariantData.length; i++ ){
                 if(oVariantData[i].key == "Default"){
                  // sKey =  oVariantData[i].key;
                     oModel.setProperty("/selectedKey", oVariantData[i].key);
                      this._applyVariant(oVariantData[i]);
                    break;
                 }
               }             
               
            }else{
                 this._oVM.fireSave();
                  oModel.setProperty("/selectedKey", "Default");
            }
        },

        /** -------------------------------------------
         *  SAVE VARIANTS TO PERSISTENCE
         *  -------------------------------------------
         */
        _saveVariantsToPers: async function () {
            const oContainer = this._oPersContainer;
            const oModel = this.getView().getModel("view");
            const aVariants = oModel.getProperty("/variants");

            oContainer.setItemValue("variants", aVariants);
           // var that = this;
            await new Promise((resolve, reject) => {
                oContainer.save().done(resolve).fail(reject);
               // that.fnSelectVariantByKey();
            });
        },

        /** -------------------------------------------
         *  EVENT: SAVE VARIANT
         *  -------------------------------------------
         */
        onVariantSave: async function (oEvent) {
            let sName = oEvent.getParameter("name");
            let bOverwrite = oEvent.getParameter("overwrite");
            let sKey = oEvent.getParameter("key");

            const oModel = this.getView().getModel("view");
            const aVariants = oModel.getProperty("/variants");
			this._updateFilterModel();
			const oSelectedFilterData= this.getView().getModel("filters");
            //const oSelectedFilterData= this.fnGetFilterVaules(); 
            let currentState = {
                    key:  "" ,
                    text: "",
                    executeOnSelection: false,
                    global: false,
                    state: oSelectedFilterData.oData
              }; 
            if(aVariants.length < 1){
                 sKey = "Default";
                 sName = "Default";
                 currentState = {
                            key:  sKey ,
                            text: sName,
                            executeOnSelection: false,
                            global: false,
                            state: oSelectedFilterData.oData
                        };
            }else{

                if( sKey == undefined && ( sName == undefined  || sName =="")){
                    let flagCheck = false;
                    for(let i =0 ; i < aVariants.length; i++ ){
                        if(aVariants[i].key == "Default"){
                            sKey =  aVariants[i].key;
                            sName = "Default";
                            bOverwrite = "X"
                            flagCheck = true;
                            break;
                        }
                    } 
                    if(flagCheck == false){
                            sKey =  "Default";
                            sName = "Default";
                            bOverwrite = "";           
                    }    
                        currentState = {
                            key:  sKey ,
                            text: sName,
                            executeOnSelection: false,
                            global: false,
                            state: oSelectedFilterData.oData
                    };         
                    }
                    else{
                        currentState = {
                            key: bOverwrite ? sKey : "variant_" + Date.now(),
                            text: sName,
                            executeOnSelection: false,
                            global: false,
                            state: oSelectedFilterData.oData
                    };
                }
            }
            if (bOverwrite) {
             const index = aVariants.findIndex(v => v.key === sKey);
             if (index >= 0) aVariants[index] = currentState;
            // aVariants[0] = currentState;
            } else {
                aVariants.push(currentState);
            }

             oModel.refresh();
             this._sKey = currentState.key;
             var that = this;
             this._saveVariantsToPers().then(function (oData) {
                that.fnSelectVariantByKey(that._sKey);
             });

            this._oVM.setModified(false); 
        },

        /** -------------------------------------------
         *  EVENT: SELECT VARIANT
         *  -------------------------------------------
         */
        onVariantSelect: function (oEvent) {
            const sKey = oEvent.getParameter("key");
            const oModel = this.getView().getModel("view");
            const aVariants = oModel.getProperty("/variants");

            const oVariant = aVariants.find(v => v.key === sKey);
            if (oVariant) {
                this._applyVariant(oVariant);
                //sap.m.MessageBox.show(`Variant applied: ${oVariant.text}`);
                this._oVM.setModified(false);
            }
        },
        fnSelectVariantByKey: function(sKey){
            const oModel = this.getView().getModel("view");
            const aVariants = oModel.getProperty("/variants");

            const oVariant = aVariants.find(v => v.key === sKey);
            if (oVariant) {
                this._applyVariant(oVariant);
                //sap.m.MessageBox.show(`Variant applied: ${oVariant.text}`);
                this._oVM.setModified(false);
                oModel.setProperty("/selectedKey", oVariant.key);
            }
        },
        /** -------------------------------------------
         *  EVENT: MANAGE VARIANT
         *  -------------------------------------------
         */
        onVariantManage: async function (oEvent) {
            const mParams = oEvent.getParameters();
            const aDeleted = mParams.deleted;
            const aRenamed = mParams.renamed;
            const oModel = this.getView().getModel("view");
            let aVariants = oModel.getProperty("/variants");

            // Remove deleted variants
            aVariants = aVariants.filter(v => !aDeleted.includes(v.key));

            // Update renamed variants
            aRenamed.forEach(r => {
                const v = aVariants.find(v => v.key === r.key);
                if (v) v.text = r.name;
            });

            oModel.setProperty("/variants", aVariants);
            await this._saveVariantsToPers();
           // sap.m.MessageBox.show("Variants updated");
        },

        /** -------------------------------------------
         *  APPLY VARIANT STATE TO UI
         *  -------------------------------------------
         */
        _applyVariant: function (variant) {
           //debugger;
           this.fnApplyFilerValue(variant.state);
        },
		 fnApplyFilerValue: function(oCustomFieldData){
			var oView = this.getView();
           	oView.byId("inputPlant").setValue(oCustomFieldData.PlantId);
			oView.byId("inputHu").setValue(oCustomFieldData.HandlingUnit);
			oView.byId("inputMatnr").setValue(oCustomFieldData.MaterialNumber);
			oView.byId("inputDlv").setValue(oCustomFieldData.DeliveryId);
			oView.byId("inputShipTo").setValue(oCustomFieldData.ShipToParty);
			oView.byId("inputPackInstr").setValue(oCustomFieldData.PackingInstruction);
			oView.byId("inputAllDocs").setSelected(oCustomFieldData.ShowAllDocs);
			this._updateFilterModel();
			this._setConfirmButtonState(this);
         }
	});
});