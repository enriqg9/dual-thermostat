import {html, LitElement} from "@polymer/lit-element";
import roundSlider from 'round-slider';
import roundSliderCSS from "round-slider/dist/roundslider.min.css";

const thermostatConfig = {
  radius: 150,
  step: 1,
  circleShape: "pie",
  startAngle: 315,
  width: 5,
  lineCap: "round",
  handleSize: "+10",
  showTooltip: false,
};

const modeIcons = {
  auto: "hass:autorenew",
  manual: "hass:cursor-pointer",
  heat: "hass:fire",
  cool: "hass:snowflake",
  off: "hass:power",
  fan_only: "hass:fan",
  eco: "hass:leaf",
  dry: "hass:water-percent",
  idle: "hass:power-sleep",
};

const UPDATE_PROPS = ['stateObj']

function formatTemp(temps) {
  return temps.filter(Boolean).join("-");
}

function ucfirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class DualThermostatCard extends LitElement {

  static get properties() {
    return {
      _hass: Object,
      _config: Object,
      cool_entity: Object,
      heat_entity: Object,
      entity: Object,
      stateObj: {
        type: Object,
        notify: true
      },
      mode: String,
      name: String,
      min_slider: Number,
      max_slider: Number,
      always_use_range_slider: Boolean
    }
  }

  constructor() {
    super();

    this._hass = null;
    this._config = null;
    this.cool_entity = null;
    this.heat_entity = null;
    this.entity = null;
    this.stateObj = null;
    this.name = null;
    this.mode = null;
    this.min_slider = null;
    this.max_slider = null;
    this.always_use_range_slider = null;
  }

  set hass(hass) {
    this._hass = hass;

    if (this._hass && (this._config.entities || this._config.entity)) {
      if (this._config.entities) {
        let {cool, heat} = this.spreadEntities(this._config.entities);

        this.cool_entity = this.validateEntity(cool);
        this.heat_entity = this.validateEntity(heat);
      }
      else {
        this.entity = this.validateEntity(this._config.entity);
      }

      this.setStateObj(this._config.entities, this._config.entity);

      this.name = this._config.name || this.stateObj.attributes.friendly_name;

      this.min_slider = this._config.min_slider || this.stateObj.attributes.min_temp;
      this.max_slider = this._config.max_slider || this.stateObj.attributes.max_temp;

      this.always_use_range_slider = this._config.always_use_range_slider || false;

      this.mode = modeIcons[this.stateObj.state || ""] ?
        this.stateObj.state :
        "unknown-mode";
    }
  }

  spreadEntities(entities) {
    if (entities.length < 2) {
      throw new Error("Specify cool and heat entities from within the climate domain.");
    }

    let output = [];

    for (let entity of entities) {
      if (typeof entity === "string" || !('type' in entity)) {
        break;
      }

      output[entity.type] = entity.entity;
    }

    if (Object.keys(output).length == 0) {
      output['cool'] = entities[0];
      output['heat'] = entities[1];
    }

    return output;
  }

  setStateObj(entities, entity) {
    if (entities) {
      this.stateObj = (typeof entities[0] === "string" ?
        this._hass.states[entities[0]] :
        this._hass.states[entities[0].entity]);
    } else {
      this.stateObj = this._hass.states[entity];
    }
  }

  render() {
    if (!this._hass || !this.stateObj) {
      return html ``;
    }

    let broadCard = this.clientWidth > 390;

    return html `
      ${this.renderStyle()}
      <ha-card
        class="${this.mode} ${broadCard ? 'large' : "small"}">
        <div id="root">
          <div id="thermostat"></div>
          <div id="tooltip">
            <div class="title">${this.name}</div>
            <div class="current-temperature">
              <span class="current-temperature-text">
                ${this.stateObj.attributes.current_temperature}
                ${
      (this.stateObj.attributes.current_temperature || this.stateObj.attributes.temperature)
        ? html`<span class="uom">${this._hass.config.unit_system.temperature}</span>`
        : ""
      }
              </span>
            </div>
            <div class="climate-info">
            <div id="set-temperature"></div>
            <div class="current-mode">${this.localize(ucfirst(this.stateObj.state), 'state.climate.')}</div>
            <div class="modes">
              ${(this.stateObj.attributes.hvac_modes || []).map((modeItem) =>
      this.renderIcon(modeItem)
    )}
            </div>
          </div>
        </div>
        </div>
        ${this.renderFanControl()}
      </ha-card>
    `;
  }

  renderIcon(mode) {
    if (!modeIcons[mode]) {
      return html ``;
    }

    return html `
      <ha-icon
        class="${this.mode === mode ? 'selected-icon' : ''}"
        .mode="${mode}"
        .icon="${modeIcons[mode]}"
        @click="${this.handleModeClick}"
      ></ha-icon>
    `;
  }

  renderFanControl() {
    if (!this._config.fan_control) {
      return '';
    }

    return html `
      <div class="fan-info">
        <paper-dropdown-menu
          class="fan-mode"
          label="Fan"
          @selected-item-changed="${this.handleFanMode}"
        >
          <paper-listbox
            slot="dropdown-content"
            selected="${this.stateObj.attributes.fan_modes.indexOf(this.stateObj.attributes.fan_mode)}"
          >
            ${(this.stateObj.attributes.fan_modes || []).map((fanMode) => {
        return html`<paper-item mode="${fanMode}">${fanMode}</paper-item>`;
      }
    )}
          </paper-listbox>
        </paper-dropdown-menu>
      </div>
    `;
  }

  handleModeClick(e) {
    this._hass.callService("climate", "set_hvac_mode", {
      entity_id: this.stateObj.entity_id,
      hvac_mode: e.currentTarget.mode,
    });
  }

  handleFanMode(e) {
    let {
      detail: {
        value: node
      }
    } = e
    if (!node) return
    let value = node.getAttribute('mode')

    if (value && value !== this.stateObj.attributes.fan_mode) {
      this._hass.callService("climate", "set_fan_mode", {
        entity_id: this.stateObj.entity_id,
        fan_mode: value,
      });
    }
  }

  shouldUpdate(changedProps) {
    return UPDATE_PROPS.some(prop => changedProps.has(prop))
  }

  firstUpdated() {
    jQuery("#thermostat", this.shadowRoot).roundSlider({
      ...thermostatConfig,
      radius: this.clientWidth / 3,
      min: this.min_slider,
      max: this.max_slider,
      sliderType: (this.mode === "auto" || this.mode === "heat_cool" || this.always_use_range_slider) ? "range" : "min-range",
      change: (event) => this.setTemperature(event),
      drag: (event) => this.dragEvent(event),
    });
  }

  updated(changedProps) {
    let sliderValue;
    let uiValue;
    if (this.heat_entity && this.cool_entity) {
      if (this.mode === "auto" || this.mode === "heat_cool" || this.always_use_range_slider) {
          sliderValue = `${this.heat_entity.attributes.temperature},${
            this.cool_entity.attributes.temperature
            }`;

          uiValue = formatTemp([
            String(this.heat_entity.attributes.temperature),
            String(this.cool_entity.attributes.temperature),
          ]);
      } else if (this.mode === "cool" || this.mode === "heat") {
        sliderValue = uiValue = this[this.mode + '_entity'].attributes.temperature;
      }
    }
    else {
      if (this.mode === "auto" || this.mode === "heat_cool" || this.always_use_range_slider) {
        sliderValue = `${this.entity.attributes.target_temp_low},${
          this.entity.attributes.target_temp_high
          }`;

        uiValue = formatTemp([
          String(this.entity.attributes.target_temp_low),
          String(this.entity.attributes.target_temp_high),
        ]);
      } else if (this.mode === "cool") {
        sliderValue = uiValue = this.entity.attributes.target_temp_high;
      } else if (this.mode === "heat") {
        sliderValue = uiValue = this.entity.attributes.target_temp_low;
      }
    }

    jQuery("#thermostat", this.shadowRoot).roundSlider({
      sliderType: (this.mode === "auto" || this.mode === "heat_cool" || this.always_use_range_slider) ? "range" : "min-range",
      value: uiValue ? sliderValue : "",
      disabled: !uiValue
    });

    this.shadowRoot.querySelector("#set-temperature").innerHTML = uiValue ? uiValue : "&nbsp;";
  }

  setTemperature(e) {
    if (this.heat_entity && this.cool_entity) {
      if (this.mode === "auto" || this.mode === "heat_cool" || this.always_use_range_slider) {
        if (e.handle.index === 1) {
          this._hass.callService("climate", "set_temperature", {
            entity_id: this.heat_entity.entity_id,
            temperature: e.handle.value
          });
        } else {
          this._hass.callService("climate", "set_temperature", {
            entity_id: this.cool_entity.entity_id,
            temperature: e.handle.value
          });
        }
      } else if (this.mode === "cool" || this.mode === "heat") {
        this._hass.callService("climate", "set_temperature", {
          entity_id: this[this.mode + '_entity'].entity_id,
          temperature: e.value,
        });
      }
    } else {
      if (this.mode === "auto" || this.mode === "heat_cool" || this.always_use_range_slider) {
        if (e.handle.index === 1) {
          this._hass.callService("climate", "set_temperature", {
            entity_id: this.entity.entity_id,
            target_temp_low: e.handle.value
          });
        } else {
          this._hass.callService("climate", "set_temperature", {
            entity_id: this.entity.entity_id,
            target_temp_high: e.handle.value
          });
        }
      } else if (this.mode === "cool") {
        this._hass.callService("climate", "set_temperature", {
          entity_id: this.entity.entity_id,
          target_temp_high: e.value,
        });
      } else if (this.mode === "heat") {
        this._hass.callService("climate", "set_temperature", {
          entity_id: this.entity.entity_id,
          target_temp_low: e.value,
        });
      }
    }
  }

  dragEvent(e) {
    this.shadowRoot.querySelector("#set-temperature").innerHTML = formatTemp(
      String(e.value).split(",")
    );
  }

  validateEntity(entity) {
    let output = this._hass.states[entity] ? this._hass.states[entity] : null;

    if (!output) {
      throw new Error("Invalid entity.");
    }

    return output;
  }

  localize(label, prefix) {
    const lang = this._hass.selectedLanguage || this._hass.language;
    return this._hass.resources[lang][`${prefix}${label}`] || label
  }

  renderStyle() {
    return html `
      <style>
        ${roundSliderCSS}
        :host {
          display: block;
        }
        ha-card {
          overflow: hidden;
          --rail-border-color: transparent;
          --auto-color: green;
          --eco-color: springgreen;
          --cool-color: #2b9af9;
          --heat-color: #ff8100;
          --manual-color: #44739e;
          --off-color: #8a8a8a;
          --fan_only-color: #8a8a8a;
          --dry-color: #efbd07;
          --idle-color: #8a8a8a;
          --unknown-color: #bac;
        }
        .not-found {
          flex: 1;
          background-color: yellow;
          padding: 8px;
        }
        #root {
          position: relative;
          overflow: hidden;
        }
        .auto {
          --mode-color: var(--auto-color);
        }
        .cool {
          --mode-color: var(--cool-color);
        }
        .heat {
          --mode-color: var(--heat-color);
        }
        .manual {
          --mode-color: var(--manual-color);
        }
        .off {
          --mode-color: var(--off-color);
        }
        .fan_only {
          --mode-color: var(--fan_only-color);
        }
        .eco {
          --mode-color: var(--eco-color);
        }
        .dry {
          --mode-color: var(--dry-color);
        }
        .idle {
          --mode-color: var(--idle-color);
        }
        .unknown-mode {
          --mode-color: var(--unknown-color);
        }
        .no-title {
          --title-position-top: 33% !important;
        }
        .large {
          --thermostat-padding-top: 25px;
          --thermostat-margin-bottom: 25px;
          --title-font-size: 28px;
          --title-position-top: 27%;
          --climate-info-position-top: 81%;
          --set-temperature-font-size: 25px;
          --current-temperature-font-size: 71px;
          --current-temperature-position-top: 10%;
          --current-temperature-text-padding-left: 15px;
          --uom-font-size: 20px;
          --uom-margin-left: -18px;
          --current-mode-font-size: 18px;
          --set-temperature-margin-bottom: -5px;
        }
        .small {
          --thermostat-padding-top: 15px;
          --thermostat-margin-bottom: 15px;
          --title-font-size: 18px;
          --title-position-top: 28%;
          --climate-info-position-top: 79%;
          --set-temperature-font-size: 16px;
          --current-temperature-font-size: 25px;
          --current-temperature-position-top: 5%;
          --current-temperature-text-padding-left: 7px;
          --uom-font-size: 12px;
          --uom-margin-left: -5px;
          --current-mode-font-size: 14px;
          --set-temperature-margin-bottom: 0px;
        }
        #thermostat {
          margin: 0 auto var(--thermostat-margin-bottom);
          padding-top: var(--thermostat-padding-top);
        }
        #thermostat .rs-range-color {
          background-color: var(--mode-color, var(--disabled-text-color));
        }
        #thermostat .rs-path-color {
          background-color: var(--disabled-text-color);
        }
        #thermostat .rs-handle {
          background-color: var(--paper-card-background-color, white);
          padding: 7px;
          border: 2px solid var(--disabled-text-color);
        }
        #thermostat .rs-handle.rs-focus {
          border-color: var(--mode-color, var(--disabled-text-color));
        }
        #thermostat .rs-handle:after {
          border-color: var(--mode-color, var(--disabled-text-color));
          background-color: var(--mode-color, var(--disabled-text-color));
        }
        #thermostat .rs-border {
          border-color: var(--rail-border-color);
        }
        #thermostat .rs-bar.rs-transition.rs-first,
        .rs-bar.rs-transition.rs-second {
          z-index: 20 !important;
        }
        #thermostat .rs-inner.rs-bg-color.rs-border,
        #thermostat .rs-overlay.rs-transition.rs-bg-color {
          background-color: var(--paper-card-background-color, white);
        }
        #tooltip {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          text-align: center;
          z-index: 15;
          color: var(--primary-text-color);
        }
        #set-temperature {
          font-size: var(--set-temperature-font-size);
          margin-bottom: var(--set-temperature-margin-bottom);
        }
        .title {
          font-size: var(--title-font-size);
          position: absolute;
          top: var(--title-position-top);
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .climate-info {
          position: absolute;
          top: var(--climate-info-position-top);
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
        }
        .current-mode {
          font-size: var(--current-mode-font-size);
          color: var(--secondary-text-color);
        }
        .modes {
          margin-top: 16px;
        }
        .modes ha-icon {
          color: var(--disabled-text-color);
          cursor: pointer;
          display: inline-block;
          margin: 0 10px;
        }
        .modes ha-icon.selected-icon {
          color: var(--mode-color);
        }
        .current-temperature {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: var(--current-temperature-font-size);
        }
        .current-temperature-text {
          padding-left: var(--current-temperature-text-padding-left);
        }
        .uom {
          font-size: var(--uom-font-size);
          vertical-align: top;
          margin-left: var(--uom-margin-left);
        }
        .fan-info {
          text-align: center;
          margin-top: -25px;
        }
        .rs-readonly {
          position: relative;
          z-index: auto;
        }
      </style>
    `;
  }

  setConfig(config) {
    if (config.entities) {
      for (let entity of config.entities) {
        if ((typeof entity === "string" && entity.split(".")[0] !== "climate") ||
          (entity.type === "undefined") && entity.entity.split(".")[0] !== "climate"
        ) {
          throw new Error("Specify cool and heat entities from within the climate domain.");
        }
      }
    }
    else if (config.entity) {
      if (typeof config.entity === "string" && config.entity.split(".")[0] !== "climate") {
        throw new Error("Specify cool and heat entities from within the climate domain.");
      }
    }
    else {
      throw new Error("Specify separate cool and heat entities or provide a single dual temperature entity.");
    }

    this._config = config;
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("dual-thermostat", DualThermostatCard);
