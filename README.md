
# World Bank Economic Data Lightning Component

This Salesforce Lightning component fetches and displays economic data for multiple countries using the World Bank API. The data includes GDP, unemployment rate, inflation rate, and population for each country.

## Components

1. **Apex Class**: `WorldBankAPIService`
2. **Lightning Component**: `economicData.cmp`
3. **Lightning Component Controller**: `economicDataController.js`

## Apex Class: WorldBankAPIService

The Apex class `WorldBankAPIService` is responsible for fetching economic data from the World Bank API.

### Methods

- **`getEconomicData(List<String> countryCodes)`**: Fetches economic data for the provided list of country codes.
- **`fetchData(String countryCode, String indicatorCode, String year)`**: Helper method to fetch data for a specific indicator.

### Inner Class

- **`CountryEconomicData`**: Represents the economic data for a country, including GDP, unemployment rate, inflation rate, and population.

### Example Code

```java
public class WorldBankAPIService {
    private static final String BASE_URL = 'https://api.worldbank.org/v2/';
    
    @AuraEnabled
    public static List<CountryEconomicData> getEconomicData(List<String> countryCodes) {
        List<CountryEconomicData> dataList = new List<CountryEconomicData>();
        String[] indicatorCodes = new String[]{'NY.GDP.MKTP.CD', 'SL.UEM.TOTL.ZS', 'FP.CPI.TOTL.ZG', 'SP.POP.TOTL'};
        
        for (String countryCode : countryCodes) {
            CountryEconomicData countryData = new CountryEconomicData();
            countryData.countryCode = countryCode;
            
            for (String code : indicatorCodes) {
                Decimal value = fetchData(countryCode, code, '2022');
                
                if (code == 'NY.GDP.MKTP.CD') {
                    countryData.gdp = value;
                } else if (code == 'SL.UEM.TOTL.ZS') {
                    countryData.unemploymentRate = value != null ? value / 100 : null;
                } else if (code == 'FP.CPI.TOTL.ZG') {
                    countryData.inflationRate = value != null ? value / 100 : null;
                } else if (code == 'SP.POP.TOTL') {
                    countryData.population = value;
                }
            }
            dataList.add(countryData);
        }
        return dataList;
    }
    
    private static Decimal fetchData(String countryCode, String indicatorCode, String year) {
        HttpRequest req = new HttpRequest();
        String endpoint = BASE_URL + 'country/' + countryCode + '/indicator/' + indicatorCode + '?format=json&per_page=1&date=' + year;
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            String responseBody = res.getBody();
            List<Object> response = (List<Object>) JSON.deserializeUntyped(responseBody);
            
            if (response.size() > 1) {
                List<Object> dataListResponse = (List<Object>) response[1];
                if (dataListResponse.size() > 0) {
                    Map<String, Object> data = (Map<String, Object>) dataListResponse[0];
                    Object valueObj = data.get('value');
                    if (valueObj != null) {
                        try {
                            return Decimal.valueOf(valueObj.toString());
                        } catch (Exception e) {
                            System.debug('Failed to parse value for ' + indicatorCode + ': ' + valueObj);
                        }
                    }
                }
            }
        } else {
            System.debug('Failed to fetch data for indicator ' + indicatorCode + ': ' + res.getStatus());
        }
        return null;
    }

    public class CountryEconomicData {
        @AuraEnabled
        public String countryCode { get; set; }
        @AuraEnabled
        public Decimal gdp { get; set; }
        @AuraEnabled
        public Decimal unemploymentRate { get; set; }
        @AuraEnabled
        public Decimal inflationRate { get; set; }
        @AuraEnabled
        public Decimal population { get; set; }
    }
}
```

## Lightning Component: economicData.cmp

The Lightning component `economicData.cmp` displays the economic data in a table.

### Markup

```xml
<aura:component controller="WorldBankAPIService" implements="flexipage:availableForAllPageTypes,force:appHostable" access="global">
    <aura:attribute name="countryCodes" type="List" default="['USA', 'CHN', 'IND', 'BRA', 'DEU', 'FRA', 'JPN', 'CAN', 'AUS', 'ZAF', 'ITA', 'MEX', 'KOR']"/>
    <aura:attribute name="indicators" type="List"/>
    <aura:attribute name="columns" type="List" default="[
        {label: 'Country Code', fieldName: 'countryCode', type: 'text'},
        {label: 'GDP', fieldName: 'gdp', type: 'currency'},
        {label: 'Unemployment Rate', fieldName: 'unemploymentRate', type: 'percent'},
        {label: 'Inflation Rate', fieldName: 'inflationRate', type: 'percent'},
        {label: 'Population', fieldName: 'population', type: 'number'}                                            
    ]"/>

    <aura:handler name="init" value="{!this}" action="{!c.doInit}"/>

    <lightning:datatable data="{!v.indicators}" columns="{!v.columns}" keyField="countryCode"/>
</aura:component>
```

## Lightning Component Controller: economicDataController.js

The JavaScript controller handles the initialization and data fetching.

### Controller Code

```javascript
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
                console.error('Failed with state: ' + state);
            }
        });
        $A.enqueueAction(action);
    }
})
```

## Setup Instructions

1. **Set Up Named Credentials**:
   - Go to **Setup** in Salesforce.
   - Search for **Named Credentials** and create a new Named Credential for the World Bank API.
   - Label: `WorldBankAPI`
   - Name: `WorldBankAPI`
   - URL: `https://api.worldbank.org/v2`
   - Identity Type: Anonymous
   - Authentication Protocol: No Authentication
   - Save the Named Credential.

2. **Create the Apex Class**:
   - Go to **Setup** in Salesforce.
   - Search for **Apex Classes**.
   - Click on **New** and paste the `WorldBankAPIService` Apex class code.
   - Save the class.

3. **Create the Lightning Component**:
   - Go to **Developer Console** in Salesforce.
   - Click on **File** > **New** > **Lightning Component**.
   - Name the component `economicData`.
   - Paste the `economicData.cmp` markup code.
   - Save the component.

4. **Create the Lightning Component Controller**:
   - In the Developer Console, open the `Controller` tab for your `economicData` component.
   - Paste the `economicDataController.js` code.
   - Save the controller.

5. **Add the Component to a Lightning Page**:
   - Go to **Setup** in Salesforce.
   - Navigate to **App Builder**.
   - Create a new Lightning Page or edit an existing one.
   - Drag and drop the `economicData` component onto the page.
   - Save and activate the page.

6. **View the Component**:
   - Navigate to the Lightning page where you added the component.
   - The component will display the economic data for the specified countries.

## Usage

- The component fetches economic data for the predefined list of country codes.
- The data is displayed in a table format, with columns for country code, GDP, unemployment rate, inflation rate, and population.
- The component automatically fetches and displays the data when the page is loaded.

