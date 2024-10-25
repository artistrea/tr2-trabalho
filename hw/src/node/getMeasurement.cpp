#include <Arduino.h>
#include <Ultrasonic.h>
#include "getMeasurement.h"

Ultrasonic ultrasonic(TRIGGER_PIN, ECHO_PIN);

uint32_t getMeasurement() {
    int sum = 0;
    for(int i=0; i < NUM_OF_MEASUREMENTS; i++) {
        int read = ultrasonic.read();
        sum += read;
        Serial.println(read);
    }

    return sum/(float)NUM_OF_MEASUREMENTS;
}
