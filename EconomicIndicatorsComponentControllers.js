({
    doInit: function(component, event, helper) {
        var action = component.get("c.getEconomicData");
        action.setParams({
            countryCodes: component.get("v.countryCodes")
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                component.set("v.indicators", response.getReturnValue());
            } else {
                console.error("Failed with state: " + state);
            }
        });
        $A.enqueueAction(action);
    }
})
