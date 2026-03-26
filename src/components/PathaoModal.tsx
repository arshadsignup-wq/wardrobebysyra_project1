"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";

interface PathaoModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: (consignmentId: string) => void;
}

interface City {
  city_id: number;
  city_name: string;
}

interface Zone {
  zone_id: number;
  zone_name: string;
}

interface Area {
  area_id: number;
  area_name: string;
}

interface Store {
  store_id: number;
  store_name: string;
}

export default function PathaoModal({ order, onClose, onSuccess }: PathaoModalProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);

  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Fetch cities and stores on mount
  useEffect(() => {
    fetch("/api/pathao/cities")
      .then((r) => r.json())
      .then((data) => {
        setCities(data.cities || []);
        setLoadingCities(false);
      })
      .catch(() => {
        setError("Failed to load cities");
        setLoadingCities(false);
      });

    fetch("/api/pathao/stores")
      .then((r) => r.json())
      .then((data) => {
        const storeList = data.stores || [];
        setStores(storeList);
        if (storeList.length === 1) {
          setSelectedStore(storeList[0].store_id);
        }
        setLoadingStores(false);
      })
      .catch(() => {
        setError("Failed to load stores");
        setLoadingStores(false);
      });
  }, []);

  // Fetch zones when city changes
  useEffect(() => {
    if (!selectedCity) {
      setZones([]);
      return;
    }
    setLoadingZones(true);
    setSelectedZone(null);
    setSelectedArea(null);
    setAreas([]);

    fetch(`/api/pathao/zones?city_id=${selectedCity}`)
      .then((r) => r.json())
      .then((data) => {
        setZones(data.zones || []);
        setLoadingZones(false);
      })
      .catch(() => setLoadingZones(false));
  }, [selectedCity]);

  // Fetch areas when zone changes
  useEffect(() => {
    if (!selectedZone) {
      setAreas([]);
      return;
    }
    setLoadingAreas(true);
    setSelectedArea(null);

    fetch(`/api/pathao/areas?zone_id=${selectedZone}`)
      .then((r) => r.json())
      .then((data) => {
        setAreas(data.areas || []);
        setLoadingAreas(false);
      })
      .catch(() => setLoadingAreas(false));
  }, [selectedZone]);

  async function handleSend() {
    if (!selectedStore) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/pathao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          cityId: selectedCity,
          zoneId: selectedZone,
          areaId: selectedArea,
          storeId: selectedStore,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess(data.consignment_id);
      } else {
        setError(data.error || "Failed to create Pathao order");
      }
    } catch {
      setError("Failed to send to Pathao");
    }
    setSending(false);
  }

  const canSend = selectedStore && !sending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Send to Pathao
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Order #{order.orderNumber} &middot; {order.customerName}
          </p>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="text-gray-500">Delivery address:</p>
            <p className="font-medium text-gray-900">{order.address}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Store selector */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pickup Store *
          </label>
          {loadingStores ? (
            <p className="text-sm text-gray-500 mb-4">Loading stores...</p>
          ) : stores.length <= 3 ? (
            <div className="flex gap-2 mb-4">
              {stores.map((store) => (
                <button
                  key={store.store_id}
                  type="button"
                  onClick={() => setSelectedStore(store.store_id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStore === store.store_id
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {store.store_name}
                </button>
              ))}
            </div>
          ) : (
            <select
              value={selectedStore || ""}
              onChange={(e) => setSelectedStore(parseInt(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            >
              <option value="">Select store...</option>
              {stores.map((store) => (
                <option key={store.store_id} value={store.store_id}>
                  {store.store_name}
                </option>
              ))}
            </select>
          )}

          {/* City */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          {loadingCities ? (
            <p className="text-sm text-gray-500 mb-4">Loading cities...</p>
          ) : (
            <select
              value={selectedCity || ""}
              onChange={(e) => setSelectedCity(parseInt(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            >
              <option value="">Select city...</option>
              {cities.map((city) => (
                <option key={city.city_id} value={city.city_id}>
                  {city.city_name}
                </option>
              ))}
            </select>
          )}

          {/* Zone */}
          {selectedCity && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone
              </label>
              {loadingZones ? (
                <p className="text-sm text-gray-500 mb-4">Loading zones...</p>
              ) : (
                <select
                  value={selectedZone || ""}
                  onChange={(e) => setSelectedZone(parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                >
                  <option value="">Select zone...</option>
                  {zones.map((zone) => (
                    <option key={zone.zone_id} value={zone.zone_id}>
                      {zone.zone_name}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          {/* Area */}
          {selectedZone && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              {loadingAreas ? (
                <p className="text-sm text-gray-500 mb-4">Loading areas...</p>
              ) : (
                <select
                  value={selectedArea || ""}
                  onChange={(e) => setSelectedArea(parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                >
                  <option value="">Select area...</option>
                  {areas.map((area) => (
                    <option key={area.area_id} value={area.area_id}>
                      {area.area_name}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex gap-3 shrink-0">
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Confirm & Send"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
