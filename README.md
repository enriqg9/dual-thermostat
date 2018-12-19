# Lovelace Dual Thermostat Card

A custom Lovelace card based on the native thermostat card that allows to control dual thermostats that create separate Heat and Cool entities. 

Heat and Cool entities are updated depending on the active thermostat mode. The low point on the Auto mode controls the heat entity and the high point controls the cool entity allowing you to use a single card for both entities. 

![Example thermostat](https://github.com/enriqg9/dual-thermostat/raw/master/dual-thermostat.png)

## Installation

1. Download the repo as a zip or with git clone and copy the `/dual-thermostat` folder to the `/www` in your configuration folder.
2. Configure Lovelace to load the card:
    ```
    resources:
      - url: /local/dual-thermostat/dual-thermostat.js?v=1
        type: module
    ```

## Available configuration options:

* `entities` *array*
	* `cool`: The thermostat cooling entity id **required**
	* `heat`: The thermostat heating entity id **required**
* `name` *string*: Override the card name. (Default: Uses the friendly_name attribute of the first climate entity provided)
* `fan_control` *bool*: Show the fan control dropdown (Default: false)

## Example usage:

```yaml
cards:
  - type: custom:dual-thermostat
  name: Downstairs
  entities:
    cool: climate.downstairs_cool
    heat: climate.downstairs_heat
  fan_control: true
```