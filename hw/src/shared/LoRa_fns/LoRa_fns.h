
#ifndef MINIMUM_TIME_BETWEEN_POLLING_IN_MS
// 50min = 1.000*60*50 ms = 3.000.000 ms
#define MINIMUM_TIME_BETWEEN_POLLING_IN_MS 10000
#endif

// caso não dê pra linkar isso daqui, copiar e colar depois

#include <stdint.h>
#include <LoRa.h>
#include <Arduino.h>

#ifndef LORA_FNS_H
#define LORA_FNS_H

#ifndef OWN_ID
// gateway id is 0 for ease
#define OWN_ID 0
#endif


// Gateway - Sends messages with enableInvertIQ()
//         - Receives messages with disableInvertIQ()
// Node    - Sends messages with disableInvertIQ()
//         - Receives messages with enableInvertIQ()


void LoRa_rxMode();

void LoRa_txMode();


// can have 255 bytes per message|packet at most
struct LoRaMessage {
  byte version = 0;
  byte destination = 0;   // gateway by default
  byte senderId = OWN_ID;
  byte data[4];           // may increase based on other stuff
};

void LoRa_sendMessage(LoRaMessage &msg);

// returns 0 on failure, 1 on success
// https://github.com/sandeepmistry/arduino-LoRa/blob/master/API.md#sending-data
int LoRa_sendPacket(byte* buffer, size_t length);


void LoRa_sendNodeMeasurement(uint32_t measurement);

void onCADdone(boolean detected);

void LoRa_sendGatewayPollBroadcast();

void LoRa_prepareForGatewayPollBroadcast();

void LoRa_prepareForGatewayPollBroadcastCleanup();

LoRaMessage& LoRa_receiveMessage(int packetSize);

#endif
