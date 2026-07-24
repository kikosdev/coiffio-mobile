import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useHomeStore } from '../../src/stores/home';

// ── Constants ────────────────────────────────────────────────────────────────

const FALLBACK = { lat: 36.8065, lng: 10.1815 };

// ── Leaflet HTML (injected inline — dark CARTO tiles, no key required) ───────

function buildLeafletHtml(gold: string, bg: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body,#map{width:100%;height:100%;background:${bg};}
  .leaflet-control-attribution{font-size:9px;background:rgba(0,0,0,0.5)!important;color:#888!important;}
  .leaflet-control-attribution a{color:#888!important;}
  .pin{width:18px;height:18px;border-radius:50%;box-shadow:0 0 0 3px rgba(0,0,0,.55),0 6px 16px rgba(0,0,0,.4);}
  .pin.user{background:${gold};border:3px solid #fff;}
  .pin.salon{background:#161616;border:3px solid ${gold};}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([${FALLBACK.lat}, ${FALLBACK.lng}], 13);

  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>', maxZoom: 19 }
  ).addTo(map);

  var userMarker = null;
  var salonMarkers = [];
  var userIcon = L.divIcon({ className: '', html: '<div class="pin user"></div>', iconSize: [18,18], iconAnchor: [9,9] });
  var salonIcon = L.divIcon({ className: '', html: '<div class="pin salon"></div>', iconSize: [18,18], iconAnchor: [9,9] });

  window.__setData = function(data) {
    var bounds = [];
    if (data.user) {
      if (userMarker) userMarker.remove();
      var userLatLng = [data.user.lat, data.user.lng];
      userMarker = L.marker(userLatLng, { icon: userIcon, zIndexOffset: 1000 }).addTo(map).bindTooltip('You');
      bounds.push(userLatLng);
    }
    salonMarkers.forEach(function(m){ m.remove(); });
    salonMarkers = [];
    (data.salons || []).forEach(function(s) {
      var salonLatLng = [s.lat, s.lng];
      var m = L.marker(salonLatLng, { icon: salonIcon }).addTo(map).bindTooltip(s.name || 'Salon');
      m.on('click', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: s.id }));
      });
      salonMarkers.push(m);
      bounds.push(salonLatLng);
    });
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
    else if (bounds.length === 1) map.setView(bounds[0], 14);
  };
</script>
</body>
</html>`;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

function MoreHorizontal({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Circle cx={6} cy={12} r={1.6} />
      <Circle cx={12} cy={12} r={1.6} />
      <Circle cx={18} cy={12} r={1.6} />
    </Svg>
  );
}

function MapPinIcon({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
      <Circle cx={12} cy={10} r={2.3} />
    </Svg>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

type Mode = 'map' | 'nearby';

export default function ChooseLocation() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);

  const [mode, setMode] = useState<Mode>('map');
  const [user, setUser] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const nearby = useHomeStore((s) => s.nearby);
  const loadingNearby = useHomeStore((s) => s.loadingNearby);
  const fetchNearby = useHomeStore((s) => s.fetchNearby);

  // Only salons with real geocoded coordinates can be placed as map pins.
  const geocodedSalons = nearby.filter((s) => s.lat != null && s.lng != null) as
    (typeof nearby[number] & { lat: number; lng: number })[];

  const selectedSalon = selectedId ? nearby.find((s) => s.id === selectedId) ?? null : null;
  const sortedNearby = [...nearby].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  // Request geolocation, then fetch real nearby salons for that position
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const pos = status === 'granted'
        ? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            .then((p) => ({ lat: p.coords.latitude, lng: p.coords.longitude }))
        : FALLBACK;
      setUser(pos);
      fetchNearby(pos.lat, pos.lng, 20);
    })();
  }, []);

  // Push data into WebView after map + user + salons are ready
  const injectData = useCallback(() => {
    if (!mapReady || !webviewRef.current) return;
    const payload = JSON.stringify({
      user: user ?? FALLBACK,
      salons: geocodedSalons.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng })),
    });
    webviewRef.current.injectJavaScript(`window.__setData(${payload}); true;`);
  }, [mapReady, user, geocodedSalons]);

  useEffect(() => { injectData(); }, [injectData]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'select') setSelectedId(msg.id);
    } catch (_) {}
  };

  const leafletHtml = buildLeafletHtml(t.color.gold, t.color.bgBase);

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase, paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={t.color.textPrimary} />
        </Pressable>
        <Text style={[styles.topWordmark, { color: t.color.textPrimary }]}>BLACK BOX</Text>
        <MoreHorizontal color={t.color.textPrimary} />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: t.color.textPrimary }]}>{'Choose a\nlocation'}</Text>

      {/* Segmented toggle */}
      <View style={[styles.segmented, { backgroundColor: t.color.surfaceCard }]}>
        {(['map', 'nearby'] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[
              styles.segment,
              mode === m && { backgroundColor: t.color.textPrimary },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: mode === m ? t.color.bgBase : t.color.textSecondary },
              ]}
            >
              {m === 'map' ? 'Search on Map' : 'Nearby'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Map mode */}
      {mode === 'map' && (
        <View style={styles.mapContainer}>
          {!user && (
            <ActivityIndicator
              style={styles.loader}
              color={t.color.gold}
              size="small"
            />
          )}
          <WebView
            ref={webviewRef}
            style={styles.webview}
            source={{ html: leafletHtml }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            onLoadEnd={() => { setMapReady(true); }}
            onMessage={onMessage}
            scrollEnabled={false}
          />

          {user && !loadingNearby && nearby.length > 0 && geocodedSalons.length === 0 && (
            <View style={[styles.mapNotice, { backgroundColor: t.color.surfaceCard }]}>
              <Text style={[styles.mapNoticeText, { color: t.color.textSecondary }]}>
                Nearby salons loaded, but none have map coordinates yet.
              </Text>
            </View>
          )}

          {/* Bottom card — selected salon */}
          {selectedSalon && (
            <View
              style={[
                styles.bottomCard,
                {
                  backgroundColor: t.color.surfaceCard,
                  bottom: insets.bottom + 12,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: t.color.textPrimary }]}>
                  {selectedSalon.name}
                </Text>
                {selectedSalon.distanceKm != null && (
                  <View style={styles.cardMeta}>
                    <MapPinIcon color={t.color.textSecondary} />
                    <Text style={[styles.cardMetaText, { color: t.color.textSecondary }]}>
                      {selectedSalon.distanceKm} km
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                style={[styles.bookNowBtn, { backgroundColor: t.color.textPrimary }]}
                onPress={() => router.push({ pathname: '/(client)/salon/[id]', params: { id: selectedSalon.id } })}
              >
                <Text style={[styles.bookNowText, { color: t.color.bgBase }]}>Book Now</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Nearby mode */}
      {mode === 'nearby' && (
        <FlatList
          data={sortedNearby}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.nearbyCard,
                {
                  backgroundColor: pressed ? t.color.surfaceElevated : t.color.surfaceCard,
                  borderColor: t.color.borderSubtle,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.nearbyName, { color: t.color.textPrimary }]}>
                  {item.name}
                </Text>
                <View style={styles.nearbyMeta}>
                  {item.distanceKm != null && (
                    <>
                      <MapPinIcon color={t.color.textMuted} />
                      <Text style={[styles.nearbyMetaText, { color: t.color.textMuted }]}>
                        {item.distanceKm} km
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <Pressable
                style={[styles.bookNowBtn, { backgroundColor: t.color.textPrimary }]}
                onPress={() => router.push({ pathname: '/(client)/salon/[id]', params: { id: item.id } })}
              >
                <Text style={[styles.bookNowText, { color: t.color.bgBase }]}>Book Now</Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },

  // Top bar
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 4, paddingBottom: 0 },
  topWordmark:   { fontSize: 14, fontWeight: '800', letterSpacing: 2.52 },

  // Title
  title:         { paddingHorizontal: 22, paddingTop: 16, fontSize: 28, fontWeight: '700', lineHeight: 33 },

  // Segmented
  segmented:     { flexDirection: 'row', margin: 16, borderRadius: 100, padding: 3 },
  segment:       { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 100 },
  segmentText:   { fontSize: 13, fontWeight: '700' },

  // Map container
  mapContainer:  { flex: 1, position: 'relative' },
  webview:       { flex: 1 },
  loader:        { position: 'absolute', top: '50%', left: '50%', zIndex: 10 },
  mapNotice:     { position: 'absolute', left: 16, right: 16, top: 16, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  mapNoticeText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // Bottom card (selected salon)
  bottomCard:    { position: 'absolute', left: 12, right: 12, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardName:      { fontSize: 16, fontWeight: '700' },
  cardMeta:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  cardMetaText:  { fontSize: 13, fontWeight: '600' },

  // Shared Book Now
  bookNowBtn:    { borderRadius: 100, paddingHorizontal: 18, paddingVertical: 11, alignItems: 'center' },
  bookNowText:   { fontSize: 13, fontWeight: '700' },

  // Nearby list
  nearbyCard:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  nearbyName:    { fontSize: 16, fontWeight: '700' },
  nearbyMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  nearbyMetaText: { fontSize: 12, fontWeight: '600' },
});
