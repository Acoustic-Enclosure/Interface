'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import mqtt from 'mqtt';
import { MQTT_TOPICS } from '../utils/mqtt-topics';

// Define the connection status types
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface MqttPublishOptions {
    qos?: 0 | 1 | 2;
    retain?: boolean;
}

// Define the context type
interface MQTTContextType {
    connectionStatus: ConnectionStatus;
    messages: Record<string, string>;
    publishMessage: (topic: string, message: string | object, opts: MqttPublishOptions) => boolean;
}

// Create the context with default values
const MQTTContext = createContext<MQTTContextType>({
    connectionStatus: 'disconnected',
    messages: {},
    publishMessage: () => false,
});

// Provider props
interface MQTTProviderProps {
    children: ReactNode;
}

let client: mqtt.MqttClient | null = null;

// MQTT Provider component
export function MQTTProvider({ children }: MQTTProviderProps): React.ReactElement {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [messages, setMessages] = useState<Record<string, string>>({});

    // Initialize MQTT client
    useEffect(() => {
      const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;
      if (!brokerUrl) {
        console.error('MQTT broker URL is not defined');
        return;
      }

      console.log('Connecting to MQTT broker:', brokerUrl);
      setConnectionStatus('connecting');
      
      client = mqtt.connect(`${brokerUrl}/mqtt`, { 
        clientId: 'NEXTJS_APP_CLIENT',
        username: 'client',
        password: 'client',
      });

      client.on('connect', () => {
        console.log('Connected to MQTT broker');
        setConnectionStatus('connected');
        
        // Subscribe to relevant topics
        const subscriptionTopics = [
            MQTT_TOPICS.DV_STATUS,
            MQTT_TOPICS.MT_WORKING,
        ]
        subscriptionTopics.forEach((topic) => {
          client?.subscribe(topic, (err) => {
            if (err) console.error(`Failed to subscribe to ${topic}:`, err);
            else console.log(`Subscribed to ${topic}`);
          });
        });
      });

      client.on('error', (err) => {
        console.error('MQTT connection error:', err);
        setConnectionStatus('error');
      });

      client.on('close', () => {
        console.log('MQTT connection closed');
        setConnectionStatus('disconnected');
      });

      client.on('message', (topic, message) => {
        const messageStr = message.toString();
        console.log(`Received message on ${topic}:`, messageStr);
        
        setMessages(prev => ({
          ...prev,
          [topic]: messageStr
        }));
      });

      // Cleanup on unmount
      return () => {
        if (client) {
          console.log('Closing MQTT connection');
          client.end();
          setConnectionStatus('disconnected');
        }
      };
    }, []);

    // Function to directly publish MQTT messages
    const publishMessage = (topic: string, message: string | object, opts: MqttPublishOptions = {}) => {
      if (!client || connectionStatus !== 'connected') {
        console.error('Cannot publish message: MQTT client not connected');
        return false;
      }

      const messageStr = typeof message === 'object' ? JSON.stringify(message) : message;
      client.publish(topic, messageStr, opts);
      console.log(`Published to ${topic}:`, messageStr);
      return true;
    };

    // Update the context value to include this function
    return (
      <MQTTContext.Provider value={{ 
        connectionStatus, 
        messages,
        publishMessage  // Add this new function to the context
      }}>
        {children}
      </MQTTContext.Provider>
    );
}

// Custom hook to use the MQTT context
export const useMQTT = () => useContext(MQTTContext);
