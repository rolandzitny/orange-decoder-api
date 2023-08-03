const express = require('express');
const body_parser = require('body-parser');

const t1 = "cbb409c401990109857fff";
const t2 = "cbb2094e01a70109927fff";
const t3 = "cbe00b1c01a3010a2e7fff";
const ex1 = "cbbdf5c6022e01f54f7fff";
const ex4 = "cd040b55025A0401007fff";
const ex5 = "cb030b2d027c0501917fff";
const ex6 = "cb0b0b640272060b067fff";
const ex7 = "cbd50b0502e60700067fff";
const ex8 = "cbcb09e702140800010005";
const ex9 = "cdb409f401C90964CBB7F7";
const exX = "cdb409f401C90c64CBB7F7";

const app = express();
app.use(body_parser.json());

const batStatusMap = {
    "00": "UltraLow",
    "01": "Low",
    "10": "OK",
    "11": "Good",
};

const pinLevelMap = {
    "00": "Low",
    "01": "High",
};

const interrupUplinkMap = {
    "00": "False",
    "01": "True",
};

function decode(hexstring){
    // Battery - 2 hex bytes
    // 15-14 is status and 13-0 is voltage
    let bat = parseInt(hexstring.substring(0, 4), 16);
    let bat_status = batStatusMap[((bat >> 14) & 0xFF).toString(2)] || "Unknown";
    let bat_voltage = bat & 0x3FFF;

    // Build In Temperature
    let bi_tmp_val = parseInt(hexstring.substring(4, 8), 16);
    let bi_tmp_neg = (bi_tmp_val & 0x8000) !== 0; // check MSB(sign bit) with bitmask 0x8000
    let bi_tmp = bi_tmp_neg ? (bi_tmp_val - 65536) / 100 : bi_tmp_val / 100;

    // Build In Humidity
    let bi_hum = parseInt(hexstring.substring(8, 12), 16) / 10;

    // External Sensor Type
    let ext_1b = parseInt(hexstring.substring(12, 13), 16).toString(2).charAt(0);
    let ext_2B = hexstring.substring(13, 14);
    
    let json_data;

    switch (ext_2B){
        case "1":
            // External Temperature Sensor
            let ext_tmp_val = parseInt(hexstring.substring(14, 18), 16);
            let ext_tmp_neg = (ext_tmp_val & 0x8000) !== 0; // check MSB(sign bit) with bitmask 0x8000
            let external_value = ext_tmp_neg ? (ext_tmp_val - 65536) / 100 : ext_tmp_val / 100;
            
            json_data = {
                teplota: `${bi_tmp}°C`,
                vlhkost: `${bi_hum}%`,
                bateria: `${bat_voltage}mV`,
                ext_val: `${external_value}°C`,
            };
            break;
        case "4":
            // Interrupt Sensor
            let pin_level = pinLevelMap[hexstring.substring(14, 16)] || "Unknown";
            let interrupt_uplink = interrupUplinkMap[hexstring.substring(16, 18)] || "Unknown";
            
            json_data = {
                teplota: `${bi_tmp}°C`,
                vlhkost: `${bi_hum}%`,
                bateria: `${bat_voltage}mV`,
                cable_c: `${ext_1b}`,
                pin_lvl: `${pin_level}`,
                int_upl: `${interrupt_uplink}`,
            };
            break;
        case "5":
            // Illumination Sensor
            let illumination_strength = parseInt(hexstring.substring(14, 18), 16);
            json_data = {
                teplota: `${bi_tmp}°C`,
                vlhkost: `${bi_hum}%`,
                bateria: `${bat_voltage}mV`,
                cable_c: `${ext_1b}`,
                ill_str: `${illumination_strength}lux`,
            };
            break;
        case "6":
            // ADC Sensor
            let adc_voltage = parseInt(hexstring.substring(14, 18), 16) / 1000;
            json_data = {
                teplota: `${bi_tmp}°C`,
                vlhkost: `${bi_hum}%`,
                bateria: `${bat_voltage}mV`,
                cable_c: `${ext_1b}`,
                adc_vol: `${adc_voltage}v`,
            };
            break;
        case "7":
            // Counting Sensor
            let counting = parseInt(hexstring.substring(14, 18), 16);
            json_data = {
                teplota: `${bi_tmp}°C`,
                vlhkost: `${bi_hum}%`,
                bateria: `${bat_voltage}mV`,
                cable_c: `${ext_1b}`,
                count2B: `${counting}`,
            }; 
            break;
        case "8":
            // Counting Sensor 2
            let counting2 = parseInt(hexstring.substring(14, 22), 16);
            json_data = {
                teplota: `${bi_tmp}°C`,
                vlhkost: `${bi_hum}%`,
                bateria: `${bat_voltage}mV`,
                cable_c: `${ext_1b}`,
                count4B: `${counting2}`,
            };
            break;
        case "9":
            // Timestamps
            let timestamp_data = parseInt(hexstring.substring(14, 22), 16);
            json_data = {
                teplota: `${bi_tmp}°C`,
                vlhkost: `${bi_hum}%`,
                bateria: `${bat_voltage}mV`,
                timestamp: `${timestamp_data}`,
            };
            break;
        default:
            json_data = {
                teplota: `${bi_tmp}°C`,
                vlhkost: `${bi_hum}%`,
                bateria: `${bat_voltage}mV`,
                ext_val: `Unknown`,
            };
            break;
    }

    
    let json_string = JSON.stringify(json_data);
    console.log(json_string);
    return json_string;
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/decode', (req, res) => {
    const hexstring = req.body.hexstring;
    if (!hexstring){
        return res.status(400).json({error: "Hexstring is missing."});
    }

    try {
        const decoded_hexstring = decode(hexstring);
        return res.json(decoded_hexstring);
    } catch (err) {
        return res.json({error: "Decoder error."})
    }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});