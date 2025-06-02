"use client";

import { useState } from "react";
import { useMQTT } from "@/app/context/MQTTContext";
import { MQTT_TOPICS } from "@/app/utils/mqtt-topics";
import MotorConfigModal from "@/app/ui/components/motor-config-modal";

export default function Manual() {
  const { connectionStatus, messages, publishMessage } = useMQTT();
  const [setpoints, setSetpoints] = useState<Record<string, string>>({});
  const [selectedMotor, setSelectedMotor] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  // Extract device connection status from messages
  const deviceConnections = Object.entries(messages)
    .filter(([topic]) => topic.includes('/connection'))
    .map(([topic, message]) => {
      const parts = topic.split('/');
      const deviceId = parts[1];

      let isConnected;
      try {
        const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
        isConnected = parsedMessage?.status === 'CONNECTED';
      } catch (e) {
        console.error(`Failed to parse connection message for ${topic}:`, e);
        isConnected = false;
      }

      return { deviceId, isConnected };
    });

  // Create a lookup object for device connection status
  const deviceConnectionMap: Record<string, boolean> = {};
  deviceConnections.forEach(({ deviceId, isConnected }) => {
    deviceConnectionMap[deviceId] = isConnected;
  });

  // Extract motor working status from messages
  const workingStatus = Object.entries(messages)
    .filter(([topic]) => topic.includes('/telemetry/working'))
    .map(([topic, message]) => {
      const parts = topic.split('/');
      const deviceId = parts[1];
      const motorId = parts[2];

      let status;
      try {
        // Try to parse the message as JSON
        const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
        status = parsedMessage?.status === 'BUSY';
      } catch (e) {
        console.error(`Failed to parse message for ${topic}:`, e);
        status = false;
      }

      return { deviceId, motorId, working: status };
    });

  // Create a lookup object for motor working status
  const motorWorkingMap: Record<string, boolean> = {};
  workingStatus.forEach(({ deviceId, motorId, working }) => {
    motorWorkingMap[`${deviceId}-${motorId}`] = working;
  });

  const handleSetpointChange = (motorKey: string, value: string) => {
    setSetpoints(prev => ({
      ...prev,
      [motorKey]: value
    }));
  };

  const sendSetpoint = async (deviceId: string, motorId: string) => {
    const key = `${deviceId}-${motorId}`;
    const setpoint = setpoints[key] || "0";

    // Send setpoint via REST API
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_REST_API}/config/motor/${deviceId}/${motorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          {
            setpoint: parseFloat(setpoint),
          }
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to send command");
      }

      console.log(`Setpoint ${setpoint} sent to motor ${motorId}`);
    } catch (error) {
      console.error(`Failed to set setpoint for motor ${motorId}:`, error);
      throw new Error();
      
    }
  };

  const handleStop = (deviceId: string, motorId: string) => {
    // Directly publish cleanup command via MQTT
    const cleanupTopic = MQTT_TOPICS.MC_CLEAN.replace('+', deviceId).replace('+', motorId);
    publishMessage(cleanupTopic, { motorId: motorId }, { qos: 2 });
    console.log(`Cleanup command sent to ${cleanupTopic}`);
  };

  // Map motor IDs to device IDs
  const getDeviceIdForMotor = (motorId: number) => {
    if (motorId <= 2) return "NODEMCU_01";
    if (motorId <= 4) return "NODEMCU_02";
    if (motorId == 5) return "NODEMCU_03";
    if (motorId <= 7) return "NODEMCU_04";
    return "NODEMCU_05";
  };

  // Generate 9-motor grid items
  const renderMotorGrid = () => {
    const grid = [];

    for (let i = 1; i <= 9; i++) {
      const motorId = (i % 2 === 0 ? 2 : 1).toString();
      const deviceId = getDeviceIdForMotor(i);
      const key = `${deviceId}-${motorId}`;

      // First check if device is connected
      const isDeviceConnected = deviceConnectionMap[deviceId] === true;
      
      // Only check motor working status if device is connected
      const isWorking = isDeviceConnected && (motorWorkingMap[key] || false);

      grid.push(
        <div key={key} className="bg-lighterBlack p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">Motor {i.toString()}</h3>
            <div className="flex items-center">
              {isDeviceConnected ? (
                <>
                  <div className={`w-3 h-3 rounded-full mr-2 ${isWorking ? 'bg-green' : 'bg-gray-600'}`}></div>
                  <span className="text-sm">{isWorking ? 'Working' : 'Idle'}</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full bg-rosyBrown mr-2"></div>
                  <span className="text-sm text-rosyBrown">Unavailable</span>
                </>
              )}
            </div>
          </div>

          <div className="flex space-x-2 mb-3">
            <input
              value={setpoints[key] || ""}
              onChange={(e) => handleSetpointChange(key, e.target.value)}
              placeholder="Setpoint"
              disabled={!isDeviceConnected || isWorking}
              className={`bg-lightBlack border border-gray-700 p-2 rounded flex-grow ${!isDeviceConnected || isWorking ? 'cursor-not-allowed' : ''}`}
            />
            <button
              onClick={() => sendSetpoint(deviceId, motorId)}
              disabled={!isDeviceConnected || isWorking}
              className={`px-3 py-1 rounded ${!isDeviceConnected || isWorking ? 'bg-gray-700 cursor-not-allowed' : 'bg-purple hover:bg-opacity-90'}`}
            >
              Set
            </button>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => {
                setSelectedMotor(`${deviceId}-${motorId}`);
                setConfigOpen(true);
              }}
              className='px-3 py-1 rounded bg-blue-500 hover:bg-opacity-90'
            >
              PID Config
            </button>

            <button
              onClick={() => handleStop(deviceId, motorId)}
              disabled={!isDeviceConnected}
              className={`px-3 py-1 rounded ${!isDeviceConnected ? 'bg-gray-700 cursor-not-allowed' : 'bg-rosyBrown hover:bg-opacity-90'}`}
            >
              Stop
            </button>
          </div>
        </div>
      );
    }
    
    return grid;
  };

  return (
    <section>
      <h1 className="text-4xl text-foreground mb-6">Manual Control</h1>

      {connectionStatus !== 'connected' && (
        <div className="bg-rosyBrown bg-opacity-20 p-4 rounded-lg mb-6">
          <p className="text-white">Please wait for connection to establish before controlling motors.</p>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {renderMotorGrid()}
        </div>
      )}

      {configOpen && selectedMotor && (
        <MotorConfigModal
          motorId={selectedMotor}
          onClose={() => {
            setConfigOpen(false);
            setSelectedMotor(null);
          }}
        />
      )}
    </section>
  );
}
