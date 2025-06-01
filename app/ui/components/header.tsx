export default function Header() {
  // Here should lay the last treatment information, mainly when it was done and the values of reverb
  const lastTreatmentDate = "2023-10-26";
  const rtValue = 0.5;

  return (
    <header className="bg-lightBlack px-8 py-4 w-full h-full col-span-2 rounded-3xl flex flex-col">
      <h2 className="text-xl font-bold mb-2">Last Treatment</h2>

      <div className="flex items-center space-x-3">
        <p className="text-gray-400">Date: {lastTreatmentDate}</p>
        <p className="text-gray-400">RT Value: {rtValue}</p>
      </div>
    </header>
  );
}