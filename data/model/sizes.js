
"use strict";

const sizes = {
    "I": {
        "base": 1,
        "grapple": -16
    },
    "Mi": {
        "base": 1,
        "grapple": -12
    },
    "TP": {
        "base": 1,
        "grapple": -8
    },
    "P": {
        "base": 1,
        "grapple": -4
    },
    "M": {
        "base": 0,
        "grapple": 0
    },
    "G": {
        "base": -1,
        "grapple": 4
    },
    "TG": {
        "base": -2,
        "grapple": 8
    },
    "C": {
        "base": -4,
        "grapple": 12
    },
    "Gi": {
        "base": -8,
        "grapple": 16
    }
}
Object.freeze(sizes)

console.log("size - ok");
