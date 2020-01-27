Starting with HA 0.103, HA now defines only one entity for the Z-Wave thermostats thus this card is no longer needed. Use the native card instead. Card will no longer be maintained.
----

# Lovelace Dual Thermostat Card

A custom Lovelace card based on the native thermostat card that allows to control dual thermostats that create separate Heat and Cool entities.

Heat and Cool entities are updated depending on the active thermostat mode. The low point on the Auto mode controls the heat entity and the high point controls the cool entity allowing you to use a single card for both entities.

![Example thermostat](https://github.com/enriqg9/dual-thermostat/raw/master/dual-thermostat.png)

## Installation

1. Download the repo as a zip or with git clone and copy contents of the `/dist` folder to the `/www/dual-thermostat` in your configuration folder.
2. Configure Lovelace to load the card:
    ```
    resources:
      - url: /local/dual-thermostat/dual-thermostat.js?v=1
        type: js
    ```

## Available configuration options:

* `entities` *array*
  * Using entity objects:
	 * `entity` *string*: The thermostat entity id **required**
    * `type` *string*: cool or heat **required**
  * Using string notation (Cooling entity first):
    * *string* `cool_entity_id` The thermostat cooling entity id **required**
    * *string* `heat_entity_id` The thermostat heating entity id **required**
* `name` *string*: Override the card name. (Default: Uses the friendly_name attribute of the first climate entity provided)
* `fan_control` *bool*: Show the fan control dropdown (Default: false)
* `min_slider` *integer*: Override the minimum value of the slider (Default: Uses the 'min_temp' attribute provided by the thermostat)
* `max_slider` *integer*: Override the maximum value of the slider (Default: Uses the 'max_temp' attribute provided by the thermostat)

## Example usage:

#### Using entity objects

```yaml
cards:
  - type: custom:dual-thermostat
    name: Downstairs
    entities:
      - entity: climate.downstairs_cool
        type: cool
      - entity: climate.downstairs_heat
        type: heat
    fan_control: true
    min_slider: 60
    max_slider: 80
```

#### Using string (First provided entity will define to the cool entity)

```yaml
cards:
  - type: custom:dual-thermostat
    name: Downstairs
    entities:
      - climate.downstairs_cool
      - climate.downstairs_heat
    fan_control: true
    min_slider: 60
    max_slider: 80
```
