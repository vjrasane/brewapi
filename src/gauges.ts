import { Gauge } from "prom-client"

export const temperature = new Gauge({
    name: "brew_temperature",
    help: "Temperature of the brew",
    labelNames: ["brew_name", "unit"]
})

export const gravity = new Gauge({
    name: "brew_gravity",
    help: "Specific gravity of the brew",
    labelNames: ["brew_name"]
})

export const abv = new Gauge({
    name: "brew_abv",
    help: "Alcohol by volume of the brew",
    labelNames: ["brew_name", "unit"]
})