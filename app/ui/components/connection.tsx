'use client';

import { useMQTT } from "@/app/context/MQTTContext";

export default function Connection() {
  const { connectionStatus } = useMQTT();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green';
      case 'connecting': return 'bg-yellow';
      case 'disconnected': return 'bg-rosyBrown';
      default: return 'bg-lighterBlack';
    }
  };

  return (
    <section className="bg-lightBlack px-8 py-4 w-full h-full col-span-2 rounded-3xl flex flex-col">
      <h2 className="text-xl font-bold mb-2">Connection Status</h2>

      <div className="flex items-center space-x-3">
        <div className={`w-4 h-4 rounded-full ${getStatusColor()}`}></div>
        <span className="text-lg capitalize">{connectionStatus}</span>
      </div>
    </section>
  );
}
