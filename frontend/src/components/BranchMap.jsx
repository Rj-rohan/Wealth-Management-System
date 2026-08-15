/**
 * Branch map.
 *
 * Split out of the Branch Intelligence page so the Google Maps loader hook only
 * runs when an API key is configured. Calling the loader with an empty key
 * makes Google inject its own error banner over the page; the page renders a
 * short notice instead, and the branch metrics stay fully usable either way.
 */

import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";

const LIBRARIES = ["places", "marker"];

const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0a0a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1530" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const MAP_CENTER = { lat: 20.5937, lng: 78.9629 }; // Centre of India

export default function BranchMap({
  apiKey,
  branches,
  infoOverlay,
  onBranchClick,
  onCloseOverlay,
  mapRef,
  renderPin,
  statusColors,
  formatCurrency,
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  if (!isLoaded) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <p style={{ color: "#64748b", fontSize: "13px" }}>Loading map…</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={MAP_CENTER}
      zoom={5}
      options={{
        styles: MAP_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
        backgroundColor: "#0a0a1a",
      }}
      onLoad={(map) => {
        mapRef.current = map;
        if (branches.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          branches.forEach((b) => bounds.extend({ lat: b.lat, lng: b.lng }));
          map.fitBounds(bounds, 60);
        }
      }}
    >
      {branches.map((branch) => (
        <OverlayView
          key={branch.branchId}
          position={{ lat: branch.lat, lng: branch.lng }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div onClick={() => onBranchClick(branch)}>{renderPin(branch)}</div>
        </OverlayView>
      ))}

      {/* Info overlay for the selected branch */}
      {infoOverlay && (
        <OverlayView
          position={{ lat: infoOverlay.lat, lng: infoOverlay.lng }}
          mapPaneName={OverlayView.FLOAT_PANE}
        >
          <div
            style={{
              transform: "translate(-50%, calc(-100% - 24px))",
              background: "rgba(10,10,20,0.95)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              padding: "16px",
              minWidth: "220px",
              animation: "fadeUp 0.2s ease both",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9" }}>{infoOverlay.name}</p>
                <p style={{ fontSize: "11px", color: "#64748b" }}>{infoOverlay.city}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onCloseOverlay(); }}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "16px", padding: "0" }}
              >
                ×
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <p style={{ fontSize: "10px", color: "#64748b" }}>Cash</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#06b6d4" }}>{formatCurrency(infoOverlay.cashPosition)}</p>
              </div>
              <div>
                <p style={{ fontSize: "10px", color: "#64748b" }}>Revenue</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#10b981" }}>{formatCurrency(infoOverlay.monthlyRevenue)}</p>
              </div>
              <div>
                <p style={{ fontSize: "10px", color: "#64748b" }}>Expenses</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#f59e0b" }}>{formatCurrency(infoOverlay.monthlyExpenses)}</p>
              </div>
              <div>
                <p style={{ fontSize: "10px", color: "#64748b" }}>Status</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: statusColors[infoOverlay.status] }}>{infoOverlay.status}</p>
              </div>
            </div>
          </div>
        </OverlayView>
      )}
    </GoogleMap>
  );
}
