(function() {
  Parse.initialize("cBfbLa5CmmA1m7ibqFlAP0oJswW49Yzicb0I9CE7", "xxdIH9cljrRZXNhVc3XGvLFtzRAB1ltymE1o84bB");
  var ShopData = Parse.Object.extend("ShopData");
  var shopData;
  var query = new Parse.Query(ShopData);

  var app = angular.module("checklist", []);

  app.controller("appCtrl", function($scope, $compile) {
    var self = this;
    self.viewOrder = {
      id: "Print",
      bool: true
    };
    self.selectedBranch = {
      name: "",
      short: "",
      acc: "",
      address: "",
      city: "",
      selected: false
    };
    self.searchBox = "";
    self.displayedItems = model.items;
    self.viewList = false;
    self.printableShop = [];
    self.spreadsheetArray = [];
    self.shops = model.shops;
    self.items = model.items;

    // Loops through items in list and if it matches what's in the search bar
    // it will display the item
    self.search = function() {
      if (self.searchBox == " ") {
        self.displayedItems = model.items;
      } else {
        self.displayedItems = [];
        for (i = 0, len = self.items.length; i < len; i++) {
          if (self.items[i].description.toLowerCase().includes(self.searchBox.toLowerCase()) || self.items[i].code.toLowerCase().includes(self.searchBox.toLowerCase())) {
            self.displayedItems.push(self.items[i]);
          }
        }
      }
    };

    // Changed the viewOrder value when clicked
    self.changeView = function() {
      if (self.viewOrder.bool === true) {
        self.viewOrder.id = "Order";
        self.viewOrder.bool = false;
      } else {
        self.viewOrder.id = "Print";
        self.viewOrder.bool = true;
      }
    };

    // Displays the list of shops that can be accessed
    self.showList = function() {
      if (self.viewList === false) {
        self.viewList = true;
      } else {
        self.viewList = false;
      }
    };

    // Loads all the saved data from previous orders
    // of a branch
    self.listClick = function(data) {
      self.showList();
      self.selectedBranch.name = data.name;
      self.selectedBranch.short = data.short;
      self.selectedBranch.acc = data.acc;
      self.selectedBranch.address = data.address;
      self.selectedBranch.city = data.city;
      loadShopDataList(data, $compile, $scope);
      self.selectedBranch.selected = true;
      $('html, body').animate({ scrollTop: 0 }, 'fast');
    };

    // Submit the order data to the server for later
    // printing
    self.saveOrder = function(data) {
      if (self.selectedBranch.name === "") {
        alert("Please select a branch before you submit");
      } else {
        saveShopData(data);
        self.selectedBranch.name = "";
        self.selectedBranch.short = "";
        self.selectedBranch.acc = "";
        self.selectedBranch.address = "";
        self.selectedBranch.city = "";
        self.selectedBranch.selected = false;
        $("#orderForm")[0].reset();
        for (i = 0, len = self.items.length; i < len; i++) {
          self.items[i].ordered = 0;
        }
        $('html, body').animate({ scrollTop: 0 }, 'fast');
      }
    };

    self.loadOrder = function(location) {
      console.log("Loads the previously saved values on the form");
    };

    // Add the shop to the print list if checkbox is checked
    self.selectPrint = function(shop) {
      if (shop.clicked === false) {
        shop.clicked = true;
        self.printableShop.push(shop);
      } else {
        for (i = 0; i < self.printableShop.length; i++) {
          if (self.printableShop[i].name == shop.name) {
            shop.clicked = false;
            self.printableShop.splice(i, 1);
          }
        }
      }
    };

    // Grabs all data required and proceeds with a print preview
    self.printPreview = function() {
      if (self.printableShop.length < 1) {
        alert("Please select the shops you want to have printed");
      } else {
        $('#loading').show();
        var spreadsheetArray = [];

        // Waits for ajax request to complete before building spreadsheet data
        setTimeout(function() {
          $('#loading').hide();
          $scope.$apply();
          buildTable(spreadsheetArray);
          buildPackingSlips(spreadsheetArray);
          $("#printButton").empty();
          $("#printButton").append('<button class="clean-gray-btn" onclick="window.print()">Print</button>');
        }, 2500);

        query.descending("updatedAt");

        // Gets all the data from the server and pushes it into a temp
        // array which will be used to build a spreadsheet
        for (i = 0, len = self.printableShop.length; i < len; i++) {
          query.equalTo("name", self.printableShop[i].name);
          query.descending("createdAt");
          query.first({
            success: function(results) {
              spreadsheetArray.push(results);
            },
            error: function(object, error) {
              // The object was not retrieved successfully.
              // error is a Parse.Error with an error code and message.
              console.log("Unable to get saved data");
            }
          });
        }
      }
    };
  });

  // Helper method for saving shop orders to the Parse cloud
  var saveShopData = function(shop) {
    shopData = new ShopData();
    shopData.set("name", shop.selectedBranch.name);
    shopData.set("short", shop.selectedBranch.short);
    shopData.set("acc", shop.selectedBranch.acc);
    shopData.set("address", shop.selectedBranch.address);
    shopData.set("city", shop.selectedBranch.city);
    for (i = 0, len = shop.items.length; i < len; i++) {
      shopData.set(shop.items[i].code, parseInt(shop.items[i].ordered));
    }
    shopData.save(null,{
      success: function(shopData) {
        console.log('New object created with objectId: ' + shopData.id);
        alert("Thanks, Your order has been saved for " + shopData.attributes.name + "!");
      },
      error: function(shopData, error) {
        // Execute any logic that should take place if the save fails.
        // error is a Parse.Error with an error code and message.
        alert('Failed to create new object, with error code: ' + error.message);
      }
    });
  };

  // Helper method for loading all previously saved data
  var loadShopDataList = function(shop, compile, scope) {
    $("#loadedOrders").empty();
    query.equalTo("name", shop.name);
    query.limit(5);
    query.descending("updatedAt");
    query.find({
      success: function(results) {
        var temp;
        for (i = 0, len = results.length; i < len; i++) {
          temp = '<div class="oldOrders" ng-click="app.loadOrder(' +
            i +
            ')"><p>File last modified: ' +
            results[i].updatedAt +
            '</p></div>';
          angular.element(document.getElementById("loadedOrders")).append(compile(temp)(scope));
        }
      },
      error: function(object, error) {
        // The object was not retrieved successfully.
        // error is a Parse.Error with an error code and message.
        console.log("Unable to load saved orders");
      }
    });
  };
})();
